import '@angular/compiler';
import { runInInjectionContext, Injector } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { readFileSync } from 'node:fs';
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
    expect(component.propertiesPanelCollapsed()).toBe(false);
  });

  it('saves a new workflow then moves the URL to edit mode without reloading the page', async () => {
    await component.save();

    expect(persistence.save).toHaveBeenCalledWith(store);
    expect(router.navigate).toHaveBeenCalledWith(['/ai-agent-mcrs/workflows', 'wf-1', 'edit'], {
      replaceUrl: true,
    });
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
    const moduleSource = readFileSync(
      'src/app/features/workflow-studio/workflow-studio.module.ts',
      'utf8',
    );

    expect(template).not.toContain('workflow-builder__canvas-toolbar');
    expect(template).not.toContain('executeEditorCommand(');
    expect(template).not.toContain('canExecuteEditorCommand(');
    expect(template).not.toContain('app-workflow-bpmn-properties-drawer');
    expect(template).not.toContain('workflow-builder__drawer');
    expect(stylesheet).not.toContain('workflow-builder__canvas-toolbar');
    expect(stylesheet).not.toContain('workflow-builder__toolbar-group');
    expect(stylesheet).not.toContain('workflow-builder__toolbar-separator');
    expect(stylesheet).not.toContain('workflow-builder__drawer');
    expect(moduleSource).not.toContain('WorkflowBpmnPropertiesDrawerComponent');
  });

  it('imports a valid BPMN file into the editable draft XML', async () => {
    const xml = '<definitions id="imported" />';

    await component.importBpmnFile(new File([xml], 'screening.bpmn', { type: 'application/xml' }));

    expect(store.bpmnXml()).toBe(xml);
    expect(store.dirty()).toBe(true);
    expect(toastService.error).not.toHaveBeenCalled();
  });

  it('ignores BPMN imports while the workflow is readonly', async () => {
    const originalXml = store.bpmnXml();
    store.setMode('readonly');

    await component.importBpmnFile(
      new File(['<definitions id="readonly" />'], 'readonly.bpmn', { type: 'application/xml' }),
    );

    expect(store.bpmnXml()).toBe(originalXml);
    expect(store.dirty()).toBe(false);
    expect(toastService.error).not.toHaveBeenCalled();
  });

  it('rejects empty and unsupported BPMN import files before changing the draft', async () => {
    const originalXml = store.bpmnXml();

    await component.importBpmnFile(new File([''], 'empty.bpmn', { type: 'application/xml' }));
    await component.importBpmnFile(
      new File(['<definitions />'], 'workflow.txt', { type: 'text/plain' }),
    );

    expect(store.bpmnXml()).toBe(originalXml);
    expect(store.dirty()).toBe(false);
    expect(toastService.error).toHaveBeenNthCalledWith(1, 'workflowStudio.bpmn.importEmpty');
    expect(toastService.error).toHaveBeenNthCalledWith(
      2,
      'workflowStudio.bpmn.importInvalidExtension',
    );
  });

  it('opens the native BPMN file picker from the toolbar action', () => {
    const fileInput = { click: vi.fn() } as unknown as HTMLInputElement;

    component.openBpmnImport(fileInput);

    expect(fileInput.click).toHaveBeenCalledOnce();
  });

  it('exports the current BPMN XML as a sanitized BPMN download', () => {
    store.updateWorkflowMetadata('KOC Screening / Flow', null);
    store.updateBpmnXml('<definitions id="exported" />');
    const anchor = document.createElement('a');
    const click = vi.spyOn(anchor, 'click').mockImplementation(() => undefined);
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const appendChild = vi.spyOn(document.body, 'appendChild');
    const removeChild = vi.spyOn(document.body, 'removeChild');
    const createObjectURL = vi.fn(() => 'blob:workflow');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });

    try {
      component.exportBpmnFile();

      expect(createElement).toHaveBeenCalledWith('a');
      expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(anchor.download).toBe('KOC-Screening-Flow.bpmn');
      expect(anchor.href).toBe('blob:workflow');
      expect(click).toHaveBeenCalledOnce();
      expect(appendChild).toHaveBeenCalledWith(anchor);
      expect(removeChild).toHaveBeenCalledWith(anchor);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:workflow');
    } finally {
      createElement.mockRestore();
      appendChild.mockRestore();
      removeChild.mockRestore();
      click.mockRestore();
      vi.unstubAllGlobals();
    }
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
