import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { WorkflowApiService } from '../api/workflow-api.service';
import { WorkflowDetail } from '../model/workflow-studio.model';
import { WorkflowEditorStore } from '../store/workflow-editor.store';
import { WorkflowPersistenceService } from './workflow-persistence.service';

describe('WorkflowPersistenceService', () => {
  let api: {
    validateWorkflow: ReturnType<typeof vi.fn>;
    createWorkflow: ReturnType<typeof vi.fn>;
    updateWorkflow: ReturnType<typeof vi.fn>;
    publishWorkflow: ReturnType<typeof vi.fn>;
  };
  let service: WorkflowPersistenceService;
  let store: WorkflowEditorStore;

  beforeEach(() => {
    api = {
      validateWorkflow: vi.fn(),
      createWorkflow: vi.fn(),
      updateWorkflow: vi.fn(),
      publishWorkflow: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        WorkflowEditorStore,
        WorkflowPersistenceService,
        { provide: WorkflowApiService, useValue: api },
      ],
    });

    service = TestBed.inject(WorkflowPersistenceService);
    store = TestBed.inject(WorkflowEditorStore);
    store.loadWorkflow(sampleDetail());
  });

  it('saves the current BPMN XML and runtime then clears dirty state', async () => {
    store.updateBpmnXml('<definitions id="updated" />');
    api.validateWorkflow.mockReturnValue(of({ valid: true, issues: [] }));
    api.updateWorkflow.mockReturnValue(of(savedDetail()));

    await service.save(store);

    expect(api.validateWorkflow).toHaveBeenCalledWith(expect.objectContaining({
      bpmnXml: '<definitions id="updated" />',
    }));
    expect(api.updateWorkflow).toHaveBeenCalledWith('wf-1', expect.objectContaining({
      bpmnXml: '<definitions id="updated" />',
      runtime: { maxParallel: 1 },
    }));
    expect(store.dirty()).toBe(false);
    expect(store.saving()).toBe(false);
  });

  it('creates a workflow when the editor has no persisted workflow id yet', async () => {
    const draft = sampleDetail();
    draft.definition.id = '';
    draft.definition.name = 'New screening workflow';
    store.loadWorkflow(draft);
    store.updateBpmnXml('<definitions id="updated" />');
    api.validateWorkflow.mockReturnValue(of({ valid: true, issues: [] }));
    api.createWorkflow.mockReturnValue(of(savedDetail()));

    await service.save(store);

    expect(api.createWorkflow).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New screening workflow',
    }));
    expect(api.updateWorkflow).not.toHaveBeenCalled();
    expect(store.workflow()?.definition.id).toBe('wf-1');
    expect(store.dirty()).toBe(false);
  });

  it('keeps dirty state when save request fails', async () => {
    store.updateBpmnXml('<definitions id="updated" />');
    api.validateWorkflow.mockReturnValue(of({ valid: true, issues: [] }));
    api.updateWorkflow.mockReturnValue(throwError(() => new Error('network')));

    await expect(service.save(store)).rejects.toThrow('network');

    expect(store.dirty()).toBe(true);
    expect(store.saving()).toBe(false);
  });

  it('blocks publish when backend validation fails', async () => {
    api.validateWorkflow.mockReturnValue(of({
      valid: false,
      issues: [{ code: 'BACKEND_VALIDATION_ERROR', severity: 'error', message: 'backend says no' }],
    }));

    await expect(service.publish(store)).rejects.toThrow('backend says no');

    expect(api.publishWorkflow).not.toHaveBeenCalled();
    expect(store.validationIssues()).toEqual([
      { code: 'BACKEND_VALIDATION_ERROR', severity: 'error', message: 'backend says no' },
    ]);
  });

  it('publishes an existing workflow detail through backend validation', async () => {
    api.validateWorkflow.mockReturnValue(of({ valid: true, issues: [] }));
    api.updateWorkflow.mockReturnValue(of(savedDetail()));
    api.publishWorkflow.mockReturnValue(of(savedDetail()));

    await service.publishDetail(sampleDetail());

    expect(api.validateWorkflow).toHaveBeenCalled();
    expect(api.updateWorkflow).toHaveBeenCalledWith('wf-1', expect.objectContaining({
      bpmnXml: '<definitions />',
    }));
    expect(api.publishWorkflow).toHaveBeenCalledWith('wf-1');
  });
});

function sampleDetail(): WorkflowDetail {
  return {
    definition: {
      id: 'wf-1',
      name: 'KOC screening',
      description: null,
      status: 'DRAFT',
      currentDraftVersionId: 'ver-1',
      currentPublishedVersionId: null,
    },
    versions: [
      {
        id: 'ver-1',
        workflowDefinitionId: 'wf-1',
        version: 1,
        status: 'DRAFT',
        bpmnXml: '<definitions />',
        runtime: { maxParallel: 1 },
      },
    ],
  };
}

function savedDetail(): WorkflowDetail {
  const detail = sampleDetail();
  detail.versions[0].bpmnXml = '<definitions id="updated" />';
  return detail;
}
