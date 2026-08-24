import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ToastService } from '@core/notifications/toast.service';
import { WorkflowApiService } from '../api/workflow-api.service';
import { createDraftWorkflowDetail } from '../model/workflow-lifecycle.config';
import { WorkflowDetail } from '../model/workflow-studio.model';
import { WorkflowLayoutService } from '../services/workflow-layout.service';
import { WorkflowPersistenceService } from '../services/workflow-persistence.service';
import { WorkflowEditorStore } from '../store/workflow-editor.store';
import { WorkflowBuilderPageComponent } from './workflow-builder-page.component';

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('WorkflowBuilderPageComponent', () => {
  let fixture: ComponentFixture<WorkflowBuilderPageComponent>;
  let component: WorkflowBuilderPageComponent;
  let api: {
    getWorkflowDetail: ReturnType<typeof vi.fn>;
    validateWorkflow: ReturnType<typeof vi.fn>;
    startWorkflow: ReturnType<typeof vi.fn>;
  };
  let persistence: {
    save: ReturnType<typeof vi.fn>;
    publish: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let toastService: { error: ReturnType<typeof vi.fn> };
  let store: WorkflowEditorStore;

  function configure(routeWorkflowId: string | null): void {
    api = {
      getWorkflowDetail: vi.fn(() => of(savedWorkflow())),
      validateWorkflow: vi.fn(() => of({ valid: true, issues: [] })),
      startWorkflow: vi.fn(() =>
        of({
          id: 'run-1',
          workflowDefinitionId: 'wf-1',
          workflowVersionId: 'ver-1',
          status: 'PENDING',
          input: {},
          startedAt: null,
          completedAt: null,
          finalOutcome: null,
          finalOutput: null,
          nodes: [],
        }),
      ),
    };
    persistence = {
      save: vi.fn(() => Promise.resolve(savedWorkflow())),
      publish: vi.fn(() => Promise.resolve(savedWorkflow())),
    };
    router = { navigate: vi.fn(() => Promise.resolve(true)) };
    toastService = { error: vi.fn() };

    TestBed.configureTestingModule({
      declarations: [WorkflowBuilderPageComponent, TranslateContentPipeStub],
      providers: [
        WorkflowEditorStore,
        WorkflowLayoutService,
        { provide: WorkflowApiService, useValue: api },
        { provide: WorkflowPersistenceService, useValue: persistence },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(routeWorkflowId ? { workflowId: routeWorkflowId } : {}),
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(WorkflowBuilderPageComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(WorkflowEditorStore);
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('initializes a new draft workflow on the create route', () => {
    configure(null);

    fixture.detectChanges();

    expect(api.getWorkflowDetail).not.toHaveBeenCalled();
    expect(store.workflow()?.definition.id).toBe('');
    expect(store.nodes().map((node) => node.type)).toEqual(['START', 'END']);
    expect(component.hasUnsavedChanges()).toBe(false);
    expect(component.generalInfoCollapsed()).toBe(false);
  });

  it('loads workflow detail on the edit route', async () => {
    configure('wf-1');

    fixture.detectChanges();
    await fixture.whenStable();

    expect(api.getWorkflowDetail).toHaveBeenCalledWith('wf-1');
    expect(store.workflow()?.definition.id).toBe('wf-1');
    expect(component.generalInfoCollapsed()).toBe(true);
  });

  it('saves a new workflow then moves the URL to edit mode without reloading the page', async () => {
    configure(null);
    fixture.detectChanges();

    await component.save();

    expect(persistence.save).toHaveBeenCalledWith(store);
    expect(router.navigate).toHaveBeenCalledWith(['/ai-agent-mcrs/workflows', 'wf-1', 'edit'], {
      replaceUrl: true,
    });
  });

  it('keeps the builder editable and shows a toast when saving fails', async () => {
    configure(null);
    fixture.detectChanges();
    persistence.save.mockRejectedValue(new Error('AI_GATE agentCode is required'));
    store.updateWorkflowMetadata('Needs agent', null);

    await component.save();

    expect(component.error()).toBeNull();
    expect(component.hasUnsavedChanges()).toBe(true);
    expect(toastService.error).toHaveBeenCalledWith('AI_GATE agentCode is required');
  });

  it('protects the route when the builder is dirty', () => {
    configure(null);
    fixture.detectChanges();

    store.updateWorkflowMetadata('Changed', null);

    expect(component.hasUnsavedChanges()).toBe(true);
  });

  it('loads a published version in readonly mode', async () => {
    configure('wf-1');
    fixture.detectChanges();
    await fixture.whenStable();

    component.selectVersion('ver-1');

    expect(store.mode()).toBe('readonly');
  });

  it('collapses general info into a compact summary without changing workflow data', () => {
    configure(null);
    fixture.detectChanges();
    store.updateWorkflowMetadata('Review workflow', 'Description');
    store.updateRuntime({ maxParallel: 3 });

    expect(component.generalInfoCollapsed()).toBe(false);

    component.toggleGeneralInfo();

    expect(component.generalInfoCollapsed()).toBe(true);
    expect(component.generalInfoSummary()).toEqual({
      name: 'Review workflow',
      maxParallel: 3,
      statusLabel: 'workflowStudio.productivity.unsavedChanges',
    });
    expect(store.workflow()?.definition.name).toBe('Review workflow');
    expect(store.workflow()?.definition.description).toBe('Description');
    expect(component.activeRuntime()?.maxParallel).toBe(3);
  });

  it('opens node drawer when a node is selected', () => {
    configure(null);
    fixture.detectChanges();
    store.addNode({ id: 'logic', type: 'LOGIC', operator: 'AND', config: {} }, { x: 140, y: 80 });

    expect(component.selectedNode()?.id).toBe('logic');
    expect(component.nodeDrawerOpen()).toBe(true);
  });

  it('closes node drawer and clears selection', () => {
    configure(null);
    fixture.detectChanges();
    store.addNode({ id: 'logic', type: 'LOGIC', operator: 'AND', config: {} }, { x: 140, y: 80 });

    component.closeNodeDrawer();

    expect(component.nodeDrawerOpen()).toBe(false);
    expect(store.selectedNodeId()).toBeNull();
  });

  it('switches drawer content when another node is selected', () => {
    configure(null);
    fixture.detectChanges();
    store.addNode({ id: 'logic-a', type: 'LOGIC', operator: 'AND', config: {} }, { x: 140, y: 80 });
    store.addNode({ id: 'logic-b', type: 'LOGIC', operator: 'OR', config: {} }, { x: 260, y: 120 });

    store.selectNode('logic-a');
    expect(component.selectedNode()?.id).toBe('logic-a');

    store.selectNode('logic-b');

    expect(component.nodeDrawerOpen()).toBe(true);
    expect(component.selectedNode()?.id).toBe('logic-b');
  });

  it('closes drawer when the selected node is deleted', () => {
    configure(null);
    fixture.detectChanges();
    store.addNode({ id: 'logic', type: 'LOGIC', operator: 'AND', config: {} }, { x: 140, y: 80 });

    store.deleteSelection();

    expect(component.selectedNode()).toBeNull();
    expect(component.nodeDrawerOpen()).toBe(false);
  });

  it('opens the correct node from a validation issue', () => {
    configure(null);
    fixture.detectChanges();
    store.addNode({ id: 'logic', type: 'LOGIC', operator: 'AND', config: {} }, { x: 140, y: 80 });

    store.selectValidationIssue({
      code: 'workflow.test',
      severity: 'error',
      message: 'Invalid node',
      nodeId: 'logic',
    });

    expect(component.nodeDrawerOpen()).toBe(true);
    expect(component.selectedNode()?.id).toBe('logic');
  });

  it('keeps readonly node drawer viewable without changing global save semantics', async () => {
    configure(null);
    fixture.detectChanges();
    store.addNode({ id: 'logic', type: 'LOGIC', operator: 'AND', config: {} }, { x: 140, y: 80 });
    store.setMode('readonly');
    store.selectNode('logic');

    expect(component.nodeDrawerOpen()).toBe(true);
    expect(component.readonlyMode()).toBe(true);

    store.setMode('design');
    store.updateNodePatch('logic', { operator: 'OR' });
    expect(store.dirty()).toBe(true);

    await component.save();

    expect(persistence.save).toHaveBeenCalledWith(store);
  });

  it('handles save, delete, undo, redo, fit view and escape shortcuts outside editable fields', async () => {
    configure(null);
    fixture.detectChanges();
    const saveSpy = vi.spyOn(component, 'save').mockResolvedValue(undefined);

    await component.handleShortcut(keyboardEvent('s', { ctrlKey: true }));
    expect(saveSpy).toHaveBeenCalledTimes(1);

    store.addNode({ id: 'logic', type: 'LOGIC', operator: 'AND', config: {} }, { x: 140, y: 80 });
    component.handleShortcut(keyboardEvent('Delete'));
    expect(store.nodes().map((node) => node.id)).toEqual(['start-1', 'end-1']);

    store.addNode({ id: 'logic', type: 'LOGIC', operator: 'AND', config: {} }, { x: 140, y: 80 });
    component.handleShortcut(keyboardEvent('z', { ctrlKey: true }));
    expect(store.nodes().map((node) => node.id)).toEqual(['start-1', 'end-1']);
    component.handleShortcut(keyboardEvent('z', { ctrlKey: true, shiftKey: true }));
    expect(store.nodes().map((node) => node.id)).toEqual(['start-1', 'end-1', 'logic']);
    component.handleShortcut(keyboardEvent('z', { ctrlKey: true }));
    component.handleShortcut(keyboardEvent('y', { ctrlKey: true }));
    expect(store.nodes().map((node) => node.id)).toEqual(['start-1', 'end-1', 'logic']);

    const canvas = { executeCommand: vi.fn(), fitView: vi.fn(), zoomIn: vi.fn(), zoomOut: vi.fn(), resetView: vi.fn() };
    component.workflowCanvas = canvas as never;
    component.handleShortcut(keyboardEvent('0', { ctrlKey: true }));
    expect(canvas.executeCommand).toHaveBeenCalledWith('fit');

    component.versionsOpen.set(true);
    component.runDialogOpen.set(true);
    store.selectNode('logic');
    component.handleShortcut(keyboardEvent('Escape'));
    expect(component.versionsOpen()).toBe(false);
    expect(component.runDialogOpen()).toBe(false);
    expect(store.selectedNodeId()).toBeNull();
  });

  it('ignores mutation shortcuts in readonly mode and ignores all shortcuts inside inputs', () => {
    configure(null);
    fixture.detectChanges();
    store.setMode('readonly');
    store.selectNode('start-1');

    component.handleShortcut(keyboardEvent('Delete'));
    expect(store.nodes().map((node) => node.id)).toEqual(['start-1', 'end-1']);

    const input = document.createElement('input');
    store.setMode('design');
    store.selectNode('start-1');
    component.handleShortcut(keyboardEvent('Delete', { target: input }));
    expect(store.nodes().map((node) => node.id)).toEqual(['start-1', 'end-1']);
  });

  it('runs canvas controls through editor-safe commands', async () => {
    configure(null);
    fixture.detectChanges();

    store.moveNode('end-1', { x: 999, y: 999 });
    await component.applyAutoLayout();
    expect(store.positions()['end-1']).toEqual({ x: 280, y: 120 });

    const canvas = { executeCommand: vi.fn(), fitView: vi.fn(), zoomIn: vi.fn(), zoomOut: vi.fn(), resetView: vi.fn() };
    component.workflowCanvas = canvas as never;
    component.fitView();
    component.zoomIn();
    component.zoomOut();
    component.resetView();
    expect(canvas.executeCommand).toHaveBeenCalledWith('fit');
    expect(canvas.executeCommand).toHaveBeenCalledWith('zoomIn');
    expect(canvas.executeCommand).toHaveBeenCalledWith('zoomOut');
    expect(canvas.executeCommand).toHaveBeenCalledWith('resetZoom');
  });

  it('executes editor commands through the single executeEditorCommand entry point', async () => {
    configure(null);
    fixture.detectChanges();
    const canvas = {
      executeCommand: vi.fn(),
      fitView: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      resetView: vi.fn(),
    };
    component.workflowCanvas = canvas as never;

    // View commands delegate to canvas executeCommand
    component.executeEditorCommand('fit');
    component.executeEditorCommand('zoomIn');
    component.executeEditorCommand('zoomOut');
    component.executeEditorCommand('resetZoom');
    component.executeEditorCommand('toggleNavigator');
    component.executeEditorCommand('fullscreen');

    expect(canvas.executeCommand).toHaveBeenCalledWith('fit');
    expect(canvas.executeCommand).toHaveBeenCalledWith('zoomIn');
    expect(canvas.executeCommand).toHaveBeenCalledWith('zoomOut');
    expect(canvas.executeCommand).toHaveBeenCalledWith('resetZoom');
    expect(canvas.executeCommand).toHaveBeenCalledWith('toggleNavigator');
    expect(canvas.executeCommand).toHaveBeenCalledWith('fullscreen');

    // Duplicate node command
    store.selectNode('start-1');
    component.executeEditorCommand('duplicate');
    expect(store.nodes().map((node) => node.id)).toContain('start-2');

    // Undo and redo commands
    component.executeEditorCommand('undo');
    expect(store.nodes().map((node) => node.id)).not.toContain('start-2');
    component.executeEditorCommand('redo');
    expect(store.nodes().map((node) => node.id)).toContain('start-2');

    // Delete node command
    store.selectNode('start-2');
    component.executeEditorCommand('delete');
    expect(store.nodes().map((node) => node.id)).not.toContain('start-2');

    // Delete edge command
    store.selectEdge('start-1__end-1');
    component.executeEditorCommand('delete');
    expect(store.edges()).toEqual([]);
  });

  it('controls command availability with canExecuteEditorCommand helper', () => {
    configure(null);
    fixture.detectChanges();

    // Initially without history or selection
    expect(component.canExecuteEditorCommand('undo')).toBe(false);
    expect(component.canExecuteEditorCommand('redo')).toBe(false);
    expect(component.canExecuteEditorCommand('autoLayout')).toBe(true);
    expect(component.canExecuteEditorCommand('duplicate')).toBe(false);
    expect(component.canExecuteEditorCommand('delete')).toBe(false);
    expect(component.canExecuteEditorCommand('fit')).toBe(true);
    expect(component.canExecuteEditorCommand('zoomIn')).toBe(true);
    expect(component.canExecuteEditorCommand('zoomOut')).toBe(true);
    expect(component.canExecuteEditorCommand('resetZoom')).toBe(true);
    expect(component.canExecuteEditorCommand('toggleNavigator')).toBe(true);
    expect(component.canExecuteEditorCommand('fullscreen')).toBe(true);

    // When node selected
    store.selectNode('start-1');
    expect(component.canExecuteEditorCommand('duplicate')).toBe(true);
    expect(component.canExecuteEditorCommand('delete')).toBe(true);

    // When edge selected
    store.selectEdge('start-1__end-1');
    expect(component.canExecuteEditorCommand('duplicate')).toBe(false);
    expect(component.canExecuteEditorCommand('delete')).toBe(true);

    // In readonly mode
    store.setMode('readonly');
    expect(component.canExecuteEditorCommand('undo')).toBe(false);
    expect(component.canExecuteEditorCommand('redo')).toBe(false);
    expect(component.canExecuteEditorCommand('autoLayout')).toBe(false);
    expect(component.canExecuteEditorCommand('duplicate')).toBe(false);
    expect(component.canExecuteEditorCommand('delete')).toBe(false);
    expect(component.canExecuteEditorCommand('fit')).toBe(true);
    expect(component.canExecuteEditorCommand('zoomIn')).toBe(true);
    expect(component.canExecuteEditorCommand('zoomOut')).toBe(true);
    expect(component.canExecuteEditorCommand('resetZoom')).toBe(true);
    expect(component.canExecuteEditorCommand('toggleNavigator')).toBe(true);
    expect(component.canExecuteEditorCommand('fullscreen')).toBe(true);
  });

  it('computes dynamic node drawer title from selected node type', () => {
    configure(null);
    fixture.detectChanges();

    expect(component.nodeDrawerTitle()).toBe('workflowStudio.inspector.staticTitle');

    store.selectNode('start-1');
    expect(component.nodeDrawerTitle()).toBe('workflowStudio.inspector.title.START');

    store.selectNode('end-1');
    expect(component.nodeDrawerTitle()).toBe('workflowStudio.inspector.title.END');

    store.addNode({
      id: 'ai-node',
      type: 'AI_GATE',
      instruction: '',
      criteria: {},
      inputMapping: { mapping: {} },
      provider: 'claude',
      agentCode: 'test-agent',
      workingDirectory: '',
      outputSchema: 'gate-result-v1',
      retryPolicy: { maxAttempts: 1 },
      timeoutPolicy: { timeoutSeconds: 30 },
    }, { x: 0, y: 0 });
    store.selectNode('ai-node');
    expect(component.nodeDrawerTitle()).toBe('workflowStudio.inspector.title.AI_GATE');

    store.addNode({
      id: 'code-node',
      type: 'CODE_GATE',
      handler: 'STRING_COMPARE',
      config: {},
      inputMapping: { mapping: {} },
      retryPolicy: { maxAttempts: 1 },
      timeoutPolicy: { timeoutSeconds: 30 },
    }, { x: 0, y: 0 });
    store.selectNode('code-node');
    expect(component.nodeDrawerTitle()).toBe('workflowStudio.inspector.title.CODE_GATE');

    store.addNode({
      id: 'logic-node',
      type: 'LOGIC',
      operator: 'AND',
      config: {},
    }, { x: 0, y: 0 });
    store.selectNode('logic-node');
    expect(component.nodeDrawerTitle()).toBe('workflowStudio.inspector.title.LOGIC');
  });

  it('selects an edge, opens edge inspector title/subtitle and allows deleting connection', () => {
    configure(null);
    fixture.detectChanges();

    store.selectEdge('start-1__end-1');

    expect(component.selectedElement()).toEqual({
      kind: 'edge',
      value: { source: 'start-1', target: 'end-1' },
    });
    expect(component.nodeDrawerOpen()).toBe(true);
    expect(component.nodeDrawerTitle()).toBe('workflowStudio.inspector.title.CONNECTION');
    expect(component.elementDrawerSubtitle()).toBe('start-1 -> end-1');

    component.executeEditorCommand('delete');

    expect(store.edges()).toEqual([]);
    expect(component.selectedElement()).toBeNull();
    expect(component.nodeDrawerOpen()).toBe(false);
  });

  it('swaps selection seamlessly when switching between node and edge', () => {
    configure(null);
    fixture.detectChanges();

    store.selectNode('start-1');
    expect(component.selectedElement()?.kind).toBe('node');
    expect(component.nodeDrawerOpen()).toBe(true);

    store.selectEdge('start-1__end-1');
    expect(component.selectedElement()?.kind).toBe('edge');
    expect(component.nodeDrawerOpen()).toBe(true);

    store.selectNode('end-1');
    expect(component.selectedElement()?.kind).toBe('node');
    expect(component.nodeDrawerOpen()).toBe(true);
  });

  it('clears selection and closes drawer on Escape or blank click', () => {
    configure(null);
    fixture.detectChanges();

    store.selectEdge('start-1__end-1');
    expect(component.nodeDrawerOpen()).toBe(true);

    component.handleShortcut(keyboardEvent('Escape'));
    expect(component.nodeDrawerOpen()).toBe(false);
    expect(component.selectedElement()).toBeNull();

    store.selectNode('start-1');
    expect(component.nodeDrawerOpen()).toBe(true);

    component.closeTransientState();
    expect(component.nodeDrawerOpen()).toBe(false);
    expect(component.selectedElement()).toBeNull();
  });

  it('handles problem selection by selecting issue, revealing element on canvas, and opening inspector', () => {
    configure(null);
    fixture.detectChanges();

    const revealElement = vi.fn();
    component.workflowCanvas = { revealElement } as never;

    component.onProblemSelected({
      code: 'START_INVALID',
      severity: 'error',
      nodeId: 'start-1',
      message: 'Start is invalid',
    });

    expect(store.selectedNodeId()).toBe('start-1');
    expect(revealElement).toHaveBeenCalledWith('start-1');
    expect(component.nodeDrawerOpen()).toBe(true);
    expect(component.selectedElement()?.kind).toBe('node');

    component.onProblemSelected({
      code: 'EDGE_INVALID',
      severity: 'error',
      edgeId: 'start-1__end-1',
      message: 'Edge is invalid',
    });

    expect(store.selectedEdgeId()).toBe('start-1__end-1');
    expect(revealElement).toHaveBeenCalledWith('start-1__end-1');
    expect(component.nodeDrawerOpen()).toBe(true);
    expect(component.selectedElement()?.kind).toBe('edge');
  });
  function keyboardEvent(
    key: string,
    options: {
      ctrlKey?: boolean;
      metaKey?: boolean;
      shiftKey?: boolean;
      target?: EventTarget;
    } = {},
  ): KeyboardEvent {
    return {
      key,
      ctrlKey: options.ctrlKey ?? false,
      metaKey: options.metaKey ?? false,
      shiftKey: options.shiftKey ?? false,
      target: options.target ?? document.body,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;
  }

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
