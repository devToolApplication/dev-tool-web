import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { createBasePageResponse } from '@core/http/base-response.model';
import { WorkflowApiService } from '../api/workflow-api.service';
import { WorkflowDetail, WorkflowRun } from '../model/workflow-studio.model';
import { WorkflowRunDetailPageComponent } from './workflow-run-detail-page.component';
import { WorkflowRunListPageComponent } from './workflow-run-list-page.component';

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('workflow run pages', () => {
  const bpmnXml =
    '<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"><process id="wf_1"><startEvent id="start" /><serviceTask id="gate" /><endEvent id="end" /></process></definitions>';
  const run: WorkflowRun = {
    id: 'run-1',
    workflowDefinitionId: 'wf-1',
    workflowVersionId: 'ver-1',
    status: 'RUNNING',
    input: { profile: { id: 'koc-1' } },
    startedAt: '2026-08-22T00:00:00Z',
    completedAt: null,
    finalOutcome: null,
    finalOutput: null,
    nodes: [],
  };
  const workflowDetail: WorkflowDetail = {
    definition: {
      id: 'wf-1',
      name: 'KOC screening',
      description: null,
      status: 'ACTIVE',
      currentDraftVersionId: null,
      currentPublishedVersionId: 'ver-1',
    },
    versions: [
      {
        id: 'ver-1',
        workflowDefinitionId: 'wf-1',
        version: 1,
        status: 'PUBLISHED',
        bpmnXml,
        runtime: { maxParallel: 1 },
      },
    ],
  };

  it('loads workflow runs with status and workflow filters and opens run detail', async () => {
    const api = {
      getRunPage: vi.fn(() => of(createBasePageResponse([run], 0, 20, 1))),
    };
    const router = { navigate: vi.fn(() => Promise.resolve(true)) };

    TestBed.configureTestingModule({
      declarations: [WorkflowRunListPageComponent, TranslateContentPipeStub],
      providers: [
        { provide: WorkflowApiService, useValue: api },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ workflowId: 'wf-1' }) } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    const fixture = TestBed.createComponent(WorkflowRunListPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(api.getRunPage).toHaveBeenCalledWith({
      page: 0,
      size: 20,
      sort: ['startedAt,desc'],
      workflowId: 'wf-1',
    });
    expect(component.runs()).toEqual([run]);

    component.setStatusFilter('ERROR');
    await fixture.whenStable();
    expect(api.getRunPage).toHaveBeenLastCalledWith({
      page: 0,
      size: 20,
      sort: ['startedAt,desc'],
      workflowId: 'wf-1',
      status: 'ERROR',
    });

    component.openRun(run);
    expect(router.navigate).toHaveBeenCalledWith(['/ai-agent-mcrs/workflow-runs', 'run-1']);
  });

  it('loads run detail with workflow canvas data, runtime overlay and node inspector selection', async () => {
    const failedRun: WorkflowRun = {
      ...run,
      nodes: [
        {
          nodeId: 'start',
          nodeType: 'START',
          executionStatus: 'COMPLETED',
          outcome: 'PASS',
          attempt: 1,
          inputSnapshot: {},
          output: {},
          evidence: {},
          reason: null,
          errorCode: null,
          errorMessage: null,
        },
        {
          nodeId: 'gate',
          nodeType: 'AI_GATE',
          executionStatus: 'ERROR',
          outcome: 'FAIL',
          attempt: 2,
          inputSnapshot: { profile: 'koc-1' },
          output: null,
          evidence: { provider: 'codex' },
          reason: 'Safety failed',
          errorCode: 'MODEL_ERROR',
          errorMessage: 'Provider timeout',
        },
      ],
    };
    const api = {
      getRun: vi.fn(() => of(failedRun)),
      getWorkflowDetail: vi.fn(() => of(workflowDetail)),
      retryRun: vi.fn(() => of({ ...failedRun, id: 'run-2', status: 'PENDING' })),
    };
    const router = { navigate: vi.fn(() => Promise.resolve(true)) };

    TestBed.configureTestingModule({
      declarations: [WorkflowRunDetailPageComponent, TranslateContentPipeStub],
      providers: [
        { provide: WorkflowApiService, useValue: api },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ runId: 'run-1' }) } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    const fixture: ComponentFixture<WorkflowRunDetailPageComponent> = TestBed.createComponent(
      WorkflowRunDetailPageComponent,
    );
    const component = fixture.componentInstance;
    await component.loadRun('run-1');

    expect(api.getRun).toHaveBeenCalledWith('run-1');
    expect(api.getWorkflowDetail).toHaveBeenCalledWith('wf-1');
    expect(component.run()?.id).toBe('run-1');
    expect(component.runtimeBpmnXml()).toContain('<definitions');
    expect(component.runtimeStatus()).toEqual({
      nodes: { start: 'COMPLETED', gate: 'ERROR' },
      edges: {},
    });

    component.onNodeSelected('gate');
    expect(component.selectedNodeExecution()).toMatchObject({
      nodeId: 'gate',
      executionStatus: 'ERROR',
      errorCode: 'MODEL_ERROR',
      errorMessage: 'Provider timeout',
    });
    expect(component.selectedRuntimeTab()).toBe('error');

    await component.retry();
    expect(api.retryRun).toHaveBeenCalledWith('run-1');
    expect(component.run()?.id).toBe('run-2');
    expect(router.navigate).toHaveBeenCalledWith(['/ai-agent-mcrs/workflow-runs', 'run-2']);
    component.ngOnDestroy();
  });

  it('polls only active runs and stops after a terminal status', async () => {
    vi.useFakeTimers();
    const api = {
      getRun: vi
        .fn()
        .mockReturnValueOnce(of(run))
        .mockReturnValueOnce(
          of({ ...run, status: 'COMPLETED', completedAt: '2026-08-22T00:01:00Z' }),
        ),
      getWorkflowDetail: vi.fn(() => of(workflowDetail)),
      retryRun: vi.fn(),
    };
    const router = { navigate: vi.fn(() => Promise.resolve(true)) };

    TestBed.configureTestingModule({
      declarations: [WorkflowRunDetailPageComponent, TranslateContentPipeStub],
      providers: [
        { provide: WorkflowApiService, useValue: api },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ runId: 'run-1' }) } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    const fixture: ComponentFixture<WorkflowRunDetailPageComponent> = TestBed.createComponent(
      WorkflowRunDetailPageComponent,
    );
    const component = fixture.componentInstance;
    try {
      await component.loadRun('run-1');

      expect(component.polling()).toBe(true);

      await vi.advanceTimersByTimeAsync(5000);

      expect(api.getRun).toHaveBeenCalledTimes(2);
      expect(component.run()?.status).toBe('COMPLETED');
      expect(component.polling()).toBe(false);

      await vi.advanceTimersByTimeAsync(5000);
      expect(api.getRun).toHaveBeenCalledTimes(2);
    } finally {
      component.ngOnDestroy();
      vi.useRealTimers();
    }
  });
});
