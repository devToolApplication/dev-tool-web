import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

vi.mock('@bpmn-io/properties-panel', () => ({
  CheckboxEntry: {},
  Group: {},
  ListGroup: {},
  SelectEntry: {},
  TextAreaEntry: {},
  TextFieldEntry: {},
  isCheckboxEntryEdited: vi.fn(),
  isSelectEntryEdited: vi.fn(),
  isTextAreaEntryEdited: vi.fn(),
  isTextFieldEntryEdited: vi.fn(),
}));

vi.mock('bpmn-js-properties-panel', () => ({
  BpmnPropertiesPanelModule: {},
  BpmnPropertiesProviderModule: {},
}));

import { I18nService } from '../../../core/i18n/i18n.service';
import { WorkflowApiService } from '../api/workflow-api.service';
import { WorkflowRun } from '../model/workflow-studio.model';
import { WorkflowRunDetailPageComponent } from './workflow-run-detail-page.component';

describe('WorkflowRunDetailPageComponent', () => {
  let component: WorkflowRunDetailPageComponent;
  let api: {
    getRun: ReturnType<typeof vi.fn>;
    getWorkflowDetail: ReturnType<typeof vi.fn>;
    retryRun: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let i18nService: { t: ReturnType<typeof vi.fn> };

  const sampleBpmnXml = `<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">
    <process id="wf_1">
      <startEvent id="start" />
      <sequenceFlow id="flow-1" sourceRef="start" targetRef="task-1" />
      <serviceTask id="task-1" />
    </process>
  </definitions>`;

  const run: WorkflowRun = {
    id: 'run-1',
    workflowDefinitionId: 'wf-1',
    workflowVersionId: 'ver-1',
    status: 'COMPLETED',
    input: { profile: 'koc' },
    startedAt: '2026-09-04T00:00:00Z',
    completedAt: '2026-09-04T00:01:00Z',
    finalOutcome: 'PASS',
    finalOutput: { success: true },
    nodes: [
      {
        nodeId: 'start',
        nodeType: 'START',
        executionStatus: 'COMPLETED',
        outcome: 'PASS',
        attempt: 1,
        inputSnapshot: {},
        output: {},
        evidence: null,
        reason: null,
        errorCode: null,
        errorMessage: null,
      },
      {
        nodeId: 'task-1',
        nodeType: 'SERVICE_TASK',
        executionStatus: 'COMPLETED',
        outcome: 'PASS',
        attempt: 1,
        inputSnapshot: { key: 'val' },
        output: { result: 'ok' },
        evidence: { proof: 'yes' },
        reason: null,
        errorCode: null,
        errorMessage: null,
      },
    ],
  };

  beforeEach(() => {
    api = {
      getRun: vi.fn(() => of(run)),
      getWorkflowDetail: vi.fn(() =>
        of({
          definition: { id: 'wf-1', name: 'Trading Agent' } as any,
          versions: [{ id: 'ver-1', bpmnXml: sampleBpmnXml } as any],
        })
      ),
      retryRun: vi.fn(() => of({ ...run, status: 'RUNNING' })),
    };
    router = { navigate: vi.fn(() => Promise.resolve(true)) };
    i18nService = { t: vi.fn((key: string) => key) };

    const activatedRoute: any = {
      snapshot: { paramMap: { get: () => 'run-1' } },
    };

    const injector = Injector.create({
      providers: [
        { provide: WorkflowApiService, useValue: api },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: I18nService, useValue: i18nService },
      ],
    });

    component = runInInjectionContext(injector, () => new WorkflowRunDetailPageComponent());
  });

  it('loads run details and workflow BPMN xml on init', async () => {
    component.ngOnInit();
    await component.loadRun('run-1', true);

    expect(api.getRun).toHaveBeenCalledWith('run-1');
    expect(api.getWorkflowDetail).toHaveBeenCalledWith('wf-1');
    expect(component.run()?.id).toBe('run-1');
    expect(component.bpmnXml()).toBe(sampleBpmnXml);
    expect(component.runtimeVisualState().edges).toEqual({
      'flow-1': 'COMPLETED',
    });
  });

  it('selects node execution on node click or step click', async () => {
    component.run.set(run);
    component.onNodeSelected('task-1');
    expect(component.selectedNodeId()).toBe('task-1');
    expect(component.selectedExecution()?.nodeId).toBe('task-1');
  });

  it('retries run on error', async () => {
    component.runId.set('run-1');
    await component.retryRun();
    expect(api.retryRun).toHaveBeenCalledWith('run-1');
    expect(component.run()?.status).toBe('RUNNING');
  });

  it('opens and closes node payload modal dialog', () => {
    component.openNodePayloadDialog('workflowStudio.runtime.viewInputSnapshot', 'task-1', { foo: 'bar' });
    expect(component.payloadDialogVisible()).toBe(true);
    expect(component.payloadDialogTitle()).toBe('workflowStudio.runtime.viewInputSnapshot (task-1)');
    expect(component.payloadDialogData()).toEqual({ foo: 'bar' });

    component.closeNodePayloadDialog();
    expect(component.payloadDialogVisible()).toBe(false);
    expect(component.payloadDialogData()).toBeNull();
  });

  it('opens and switches tabs for run payloads modal dialog', () => {
    component.run.set(run);
    component.onToolbarAction({ id: 'payloads' });
    expect(component.runPayloadsDialogVisible()).toBe(true);
    expect(component.runPayloadTab()).toBe('input');

    component.setRunPayloadTab('output');
    expect(component.runPayloadTab()).toBe('output');

    component.closeRunPayloads();
    expect(component.runPayloadsDialogVisible()).toBe(false);
  });

  it('reloads run on manual refresh action without auto-polling', () => {
    component.runId.set('run-1');
    const spy = vi.spyOn(component, 'loadRun').mockImplementation(() => Promise.resolve());
    component.onToolbarAction({ id: 'refresh' });
    expect(spy).toHaveBeenCalledWith('run-1', true);
    expect(component.actions.some((a) => a.id === 'refresh')).toBe(true);
    expect(component.actions.some((a) => a.id === 'polling')).toBe(false);
  });
});
