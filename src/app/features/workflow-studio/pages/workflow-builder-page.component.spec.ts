import '@angular/compiler';
import { runInInjectionContext, Injector } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { readFileSync } from 'node:fs';
import { of } from 'rxjs';

import { ToastService } from '../../../core/notifications/toast.service';
import { WorkflowApiService } from '../api/workflow-api.service';
import { createDraftWorkflowDetail } from '../model/workflow-lifecycle.config';
import { WorkflowDetail } from '../model/workflow-studio.model';
import { WorkflowPersistenceService } from '../services/workflow-persistence.service';
import { WorkflowEditorStore } from '../store/workflow-editor.store';
import { WorkflowBuilderPageComponent } from './workflow-builder-page.component';

describe('WorkflowBuilderPageComponent unit', () => {
  let component: WorkflowBuilderPageComponent;
  let api: any;
  let persistence: any;
  let router: any;
  let toastService: any;
  let store: WorkflowEditorStore;

  beforeEach(() => {
    api = {
      getWorkflowDetail: vi.fn(() => of(savedWorkflow())),
      validateWorkflow: vi.fn(() => of({ valid: true, issues: [] })),
      startWorkflow: vi.fn(() => of({ id: 'run-1' })),
    };
    persistence = {
      save: vi.fn(() => Promise.resolve(savedWorkflow())),
      publish: vi.fn(() => Promise.resolve(savedWorkflow())),
    };
    router = { navigate: vi.fn(() => Promise.resolve(true)) };
    toastService = { error: vi.fn() };
    store = new WorkflowEditorStore();

    const injector = Injector.create({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
            },
          },
        },
        { provide: Router, useValue: router },
        { provide: WorkflowApiService, useValue: api },
        { provide: WorkflowPersistenceService, useValue: persistence },
        { provide: ToastService, useValue: toastService },
        { provide: WorkflowEditorStore, useValue: store },
      ],
    });

    component = runInInjectionContext(injector, () => new WorkflowBuilderPageComponent());
    component.ngOnInit();
  });

  it('initializes a new draft workflow on the create route', () => {
    expect(api.getWorkflowDetail).not.toHaveBeenCalled();
    expect(store.workflow()?.definition.id).toBe('');
    expect(component.hasUnsavedChanges()).toBe(false);
    expect(component.generalInfoCollapsed()).toBe(false);
  });

  it('saves a new workflow then moves the URL to edit mode without reloading the page', async () => {
    await component.save();

    expect(persistence.save).toHaveBeenCalledWith(store);
    expect(router.navigate).toHaveBeenCalledWith(['/ai-agent-mcrs/workflows', 'wf-1', 'edit'], {
      replaceUrl: true,
    });
  });

  it('sets and clears selectedBpmnElement on canvas elementSelected and closeTransientState', () => {
    expect(component.selectedBpmnElement()).toBeNull();

    component.onElementSelected({
      id: 'service-1',
      type: 'bpmn:ServiceTask',
      name: 'AI Task',
      flowableTopic: 'ai-task',
    });

    expect(component.selectedBpmnElement()).toMatchObject({
      id: 'service-1',
      name: 'AI Task',
      flowableTopic: 'ai-task',
    });

    component.closeTransientState();
    expect(component.selectedBpmnElement()).toBeNull();
  });

  it('calls canvas updateElementConfig on elementConfigChange', () => {
    const updateSpy = vi.fn(async () => {});
    component.workflowBpmnCanvas = {
      updateElementConfig: updateSpy,
    } as any;

    component.onElementConfigChange({
      id: 'service-1',
      type: 'bpmn:ServiceTask',
      name: 'Updated Name',
    });

    expect(updateSpy).toHaveBeenCalledWith({
      id: 'service-1',
      type: 'bpmn:ServiceTask',
      name: 'Updated Name',
    });
    expect(component.selectedBpmnElement()?.name).toBe('Updated Name');
  });

  it('leaves non-save keyboard shortcuts to bpmn-js', async () => {
    const undoEvent = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      cancelable: true,
    });
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      cancelable: true,
    });
    const undoPreventDefault = vi.spyOn(undoEvent, 'preventDefault');
    const escapePreventDefault = vi.spyOn(escapeEvent, 'preventDefault');

    await component.handleShortcut(undoEvent);
    await component.handleShortcut(escapeEvent);

    expect(undoPreventDefault).not.toHaveBeenCalled();
    expect(escapePreventDefault).not.toHaveBeenCalled();
  });

  it('keeps the builder page free of custom BPMN editor controls', () => {
    const template = readFileSync(
      'src/app/features/workflow-studio/pages/workflow-builder-page.component.html',
      'utf8',
    );
    const stylesheet = readFileSync(
      'src/app/features/workflow-studio/pages/workflow-builder-page.component.css',
      'utf8',
    );

    expect(template).not.toContain('workflow-builder__canvas-toolbar');
    expect(template).not.toContain('executeEditorCommand(');
    expect(template).not.toContain('canExecuteEditorCommand(');
    expect(stylesheet).not.toContain('workflow-builder__canvas-toolbar');
    expect(stylesheet).not.toContain('workflow-builder__toolbar-group');
    expect(stylesheet).not.toContain('workflow-builder__toolbar-separator');
  });

  function savedWorkflow(): WorkflowDetail {
    return {
      ...createDraftWorkflowDetail('wf-1'),
      definition: {
        ...createDraftWorkflowDetail('wf-1').definition,
        currentPublishedVersionId: 'ver-1',
      },
      versions: [
        {
          ...createDraftWorkflowDetail('wf-1').versions[0],
          id: 'ver-1',
          status: 'PUBLISHED',
          version: 1,
        },
        {
          ...createDraftWorkflowDetail('wf-1').versions[0],
          id: 'ver-2',
          status: 'DRAFT',
          version: 2,
        },
      ],
    };
  }
});
