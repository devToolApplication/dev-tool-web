import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { createBasePageResponse } from '../../../core/http/base-response.model';
import { WorkflowApiService } from '../api/workflow-api.service';
import { WorkflowRun } from '../model/workflow-studio.model';
import { WorkflowRunListPageComponent } from './workflow-run-list-page.component';

describe('WorkflowRunListPageComponent', () => {
  let fixture: ComponentFixture<WorkflowRunListPageComponent>;
  let component: WorkflowRunListPageComponent;
  let api: {
    getWorkflowPage: ReturnType<typeof vi.fn>;
    getRunPage: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const run: WorkflowRun = {
    id: 'run-1',
    workflowDefinitionId: 'wf-1',
    workflowVersionId: 'ver-1',
    status: 'COMPLETED',
    input: {},
    startedAt: '2026-09-04T00:00:00Z',
    completedAt: '2026-09-04T00:01:00Z',
    finalOutcome: 'PASS',
    finalOutput: {},
    nodes: [],
  };

  beforeEach(async () => {
    api = {
      getWorkflowPage: vi.fn(() => of(createBasePageResponse([{ id: 'wf-1', name: 'Workflow 1' } as any], 0, 100, 1))),
      getRunPage: vi.fn(() => of(createBasePageResponse([run], 0, 20, 1))),
    };
    router = { navigate: vi.fn(() => Promise.resolve(true)) };

    await TestBed.configureTestingModule({
      declarations: [WorkflowRunListPageComponent],
      providers: [
        { provide: WorkflowApiService, useValue: api },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(WorkflowRunListPageComponent, {
        set: { template: '<div></div>', styles: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(WorkflowRunListPageComponent);
    component = fixture.componentInstance;
  });

  it('loads workflow page and run page on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(api.getWorkflowPage).toHaveBeenCalledWith({ size: 100 });
    expect(api.getRunPage).toHaveBeenCalledWith({ page: 0, size: 20, workflowId: undefined, status: undefined });
    expect(component.runs()).toEqual([run]);
    expect(component.workflows().length).toBe(1);
  });

  it('filters runs by workflow and status', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.onFilterChange({ workflowId: 'wf-1', status: 'COMPLETED' });
    expect(api.getRunPage).toHaveBeenCalledWith({
      page: 0,
      size: 20,
      workflowId: 'wf-1',
      status: 'COMPLETED',
    });
  });

  it('resets filter', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.onFilterReset();
    expect(api.getRunPage).toHaveBeenCalledWith({
      page: 0,
      size: 20,
      workflowId: undefined,
      status: undefined,
    });
  });

  it('navigates to debugger when row clicked', () => {
    component.openDebugger(run);
    expect(router.navigate).toHaveBeenCalledWith(['run-1'], { relativeTo: TestBed.inject(ActivatedRoute) });
  });
});
