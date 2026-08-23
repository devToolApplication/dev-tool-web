import { TestBed } from '@angular/core/testing';

import { WorkflowEditorStore } from './workflow-editor.store';
import { WorkflowDetail, WorkflowNode } from '../model/workflow-studio.model';

describe('WorkflowEditorStore', () => {
  let store: WorkflowEditorStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WorkflowEditorStore],
    });

    store = TestBed.inject(WorkflowEditorStore);
  });

  it('loads the draft workflow graph and editor metadata as a clean snapshot', () => {
    const detail = sampleDetail();

    store.loadWorkflow(detail);

    expect(store.workflow()?.definition.id).toBe('wf-1');
    expect(store.nodes()).toEqual(detail.versions[0].definition.nodes);
    expect(store.edges()).toEqual(detail.versions[0].definition.edges);
    expect(store.positions()).toEqual({
      start: { x: 0, y: 0 },
      end: { x: 280, y: 0 },
    });
    expect(store.viewport()).toEqual({ x: 10, y: 20, zoom: 0.75 });
    expect(store.dirty()).toBe(false);

    detail.versions[0].definition.nodes[0] = { id: 'mutated', type: 'START' };
    expect(store.nodes()[0]).toEqual({ id: 'start', type: 'START' });
  });

  it('adds, updates, moves and removes nodes through immutable store actions', () => {
    store.loadWorkflow(sampleDetail());
    const gate: WorkflowNode = {
      id: 'gate',
      type: 'CODE_GATE',
      handler: 'NUMBER_COMPARE',
      config: { operator: 'GT' },
      inputMapping: { mapping: { value: '${input.value}' } },
      retryPolicy: { maxAttempts: 1 },
      timeoutPolicy: { timeoutSeconds: 30 },
    };

    store.addNode(gate, { x: 140, y: 60 });
    store.updateNode('gate', {
      ...gate,
      handler: 'UPDATED',
    });
    store.moveNode('gate', { x: 150, y: 80 });
    store.connect({ source: 'start', target: 'gate' });
    store.connect({ source: 'gate', target: 'end' });

    expect(store.nodes().find((node) => node.id === 'gate')).toMatchObject({
      id: 'gate',
      handler: 'UPDATED',
    });
    expect(store.positions()['gate']).toEqual({ x: 150, y: 80 });
    expect(store.selectedNodeId()).toBe('gate');
    expect(store.edges()).toEqual([
      { source: 'start', target: 'end' },
      { source: 'start', target: 'gate' },
      { source: 'gate', target: 'end' },
    ]);

    store.removeNode('gate');

    expect(store.nodes().map((node) => node.id)).toEqual(['start', 'end']);
    expect(store.edges()).toEqual([{ source: 'start', target: 'end' }]);
    expect(store.positions()['gate']).toBeUndefined();
    expect(store.selectedNodeId()).toBeNull();
    expect(store.dirty()).toBe(true);
  });

  it('connects, reconnects, disconnects and selects graph items', () => {
    store.loadWorkflow(sampleDetail());
    const middle: WorkflowNode = {
      id: 'middle',
      type: 'LOGIC',
      operator: 'AND',
      config: {},
    };
    store.addNode(middle, { x: 140, y: 60 });
    store.markSaved();

    store.connect({ source: 'start', target: 'middle' });
    store.selectEdge('start__middle');
    store.reconnect('start__middle', { source: 'middle', target: 'end' });
    store.selectNode('middle');
    store.disconnect('middle__end');

    expect(store.edges()).toEqual([{ source: 'start', target: 'end' }]);
    expect(store.selectedNodeId()).toBe('middle');
    expect(store.selectedEdgeId()).toBeNull();
    expect(store.dirty()).toBe(true);
  });

  it('creates palette nodes by backend type and blocks invalid connections', () => {
    store.loadWorkflow(sampleDetail());

    const created = store.addNodeByType('AI_GATE', { x: 140, y: 60 });
    store.connect({ source: 'end', target: created.id });

    expect(created).toMatchObject({
      id: 'ai-gate-1',
      type: 'AI_GATE',
      instruction: '',
    });
    expect(store.nodes().map((node) => node.id)).toEqual(['start', 'end', 'ai-gate-1']);
    expect(store.selectedNodeId()).toBe('ai-gate-1');
    expect(store.edges()).toEqual([{ source: 'start', target: 'end' }]);
    expect(store.validationIssues()[0]).toMatchObject({
      code: 'END_OUTGOING_NOT_ALLOWED',
      nodeId: 'end',
    });
  });

  it('patches selected node config immutably without allowing id or type changes', () => {
    const detail = sampleDetail();
    store.loadWorkflow(detail);
    const aiNode: WorkflowNode = {
      id: 'ai',
      type: 'AI_GATE',
      instruction: 'Review profile',
      criteria: { minScore: 80 },
      inputMapping: { mapping: { candidate: '${input.candidate}' } },
      provider: 'claude',
      modelProfile: 'gpt-5.2',
      toolProfile: 'facebook-readonly',
      outputSchema: 'koc-review-v1',
      retryPolicy: { maxAttempts: 2 },
      timeoutPolicy: { timeoutSeconds: 3600 },
    };
    store.addNode(aiNode, { x: 140, y: 60 });
    store.markSaved();

    store.updateNodePatch('ai', {
      id: 'changed',
      type: 'END',
      instruction: 'Updated profile review',
      criteria: { minScore: 90 },
    } as Partial<WorkflowNode>);

    expect(store.nodes().find((node) => node.id === 'ai')).toMatchObject({
      id: 'ai',
      type: 'AI_GATE',
      instruction: 'Updated profile review',
      criteria: { minScore: 90 },
    });
    expect(aiNode).toMatchObject({
      instruction: 'Review profile',
      criteria: { minScore: 80 },
    });
    expect(detail.versions[0].definition.nodes).toEqual([
      { id: 'start', type: 'START' },
      { id: 'end', type: 'END' },
    ]);
    expect(store.dirty()).toBe(true);
  });

  it('applies layout to editor positions only and reset restores the loaded snapshot', () => {
    store.loadWorkflow(sampleDetail());
    const nodesBeforeLayout = store.nodes();

    store.applyLayout({
      start: { x: 30, y: 40 },
      end: { x: 310, y: 40 },
    });

    expect(store.nodes()).toBe(nodesBeforeLayout);
    expect(store.positions()).toEqual({
      start: { x: 30, y: 40 },
      end: { x: 310, y: 40 },
    });
    expect(store.dirty()).toBe(true);

    store.reset();

    expect(store.positions()).toEqual({
      start: { x: 0, y: 0 },
      end: { x: 280, y: 0 },
    });
    expect(store.dirty()).toBe(false);
  });

  it('builds an upsert payload from current graph, runtime and editor metadata', () => {
    store.loadWorkflow(sampleDetail());
    store.moveNode('end', { x: 320, y: 40 });
    store.setViewport({ x: 4, y: 8, zoom: 0.8 });
    store.updateWorkflowMetadata('Updated screening', 'Updated description');
    store.updateRuntime({ maxParallel: 4 });

    const payload = store.toUpsertPayload();

    expect(payload).toEqual({
      name: 'Updated screening',
      description: 'Updated description',
      definition: {
        nodes: [{ id: 'start', type: 'START' }, { id: 'end', type: 'END' }],
        edges: [{ source: 'start', target: 'end' }],
      },
      runtime: { maxParallel: 4 },
      editor: {
        viewport: { x: 4, y: 8, zoom: 0.8 },
        nodes: {
          start: { x: 0, y: 0 },
          end: { x: 320, y: 40 },
        },
      },
    });
    expect(store.dirty()).toBe(true);
  });

  it('selects validation issues by node or edge reference', () => {
    store.loadWorkflow(sampleDetail());

    store.selectValidationIssue({
      code: 'EDGE_TARGET_NOT_FOUND',
      severity: 'error',
      edgeId: 'start__end',
      message: 'Target missing',
    });

    expect(store.selectedEdgeId()).toBe('start__end');
    expect(store.selectedNodeId()).toBeNull();
    expect(store.focusedValidationIssue()).toMatchObject({ edgeId: 'start__end' });

    store.selectValidationIssue({
      code: 'AI_GATE_INSTRUCTION_REQUIRED',
      severity: 'error',
      nodeId: 'start',
      field: 'instruction',
      message: 'Instruction required',
    });

    expect(store.selectedNodeId()).toBe('start');
    expect(store.selectedEdgeId()).toBeNull();
    expect(store.focusedValidationIssue()).toMatchObject({ nodeId: 'start', field: 'instruction' });
  });

  it('markSaved creates the new reset baseline', () => {
    store.loadWorkflow(sampleDetail());

    store.moveNode('end', { x: 400, y: 100 });
    store.markSaved();
    store.moveNode('end', { x: 500, y: 120 });
    store.reset();

    expect(store.positions()['end']).toEqual({ x: 400, y: 100 });
    expect(store.dirty()).toBe(false);
  });

  it('undoes and redoes editable graph snapshots', () => {
    store.loadWorkflow(sampleDetail());

    store.addNode({ id: 'logic', type: 'LOGIC', operator: 'AND', config: {} }, { x: 140, y: 80 });
    store.connect({ source: 'logic', target: 'end' });

    expect(store.nodes().map((node) => node.id)).toEqual(['start', 'end', 'logic']);
    expect(store.canUndo()).toBe(true);
    expect(store.canRedo()).toBe(false);

    store.undo();

    expect(store.edges()).toEqual([{ source: 'start', target: 'end' }]);
    expect(store.nodes().map((node) => node.id)).toEqual(['start', 'end', 'logic']);
    expect(store.canRedo()).toBe(true);

    store.undo();

    expect(store.nodes().map((node) => node.id)).toEqual(['start', 'end']);
    expect(store.dirty()).toBe(false);

    store.redo();

    expect(store.nodes().map((node) => node.id)).toEqual(['start', 'end', 'logic']);
    expect(store.positions()['logic']).toEqual({ x: 140, y: 80 });
    expect(store.dirty()).toBe(true);
  });

  it('keeps viewport changes out of dirty state and history', () => {
    store.loadWorkflow(sampleDetail());

    store.setViewport({ x: 40, y: 60, zoom: 0.5 });

    expect(store.viewport()).toEqual({ x: 40, y: 60, zoom: 0.5 });
    expect(store.dirty()).toBe(false);
    expect(store.canUndo()).toBe(false);

    store.addNode({ id: 'logic', type: 'LOGIC', operator: 'AND', config: {} }, { x: 140, y: 80 });
    store.undo();

    expect(store.nodes().map((node) => node.id)).toEqual(['start', 'end']);
    expect(store.viewport()).toEqual({ x: 40, y: 60, zoom: 0.5 });
    expect(store.dirty()).toBe(false);
  });

  it('does not add history for no-op node patches', () => {
    store.loadWorkflow(sampleDetail());

    store.updateNodePatch('start', { id: 'changed', type: 'END' } as Partial<WorkflowNode>);

    expect(store.nodes()[0]).toEqual({ id: 'start', type: 'START' });
    expect(store.canUndo()).toBe(false);
    expect(store.dirty()).toBe(false);
  });

  it('deletes the selected editable node or edge and keeps readonly history unchanged', () => {
    store.loadWorkflow(sampleDetail());

    store.addNode({ id: 'logic', type: 'LOGIC', operator: 'AND', config: {} }, { x: 140, y: 80 });
    store.selectNode('logic');
    store.deleteSelection();

    expect(store.nodes().map((node) => node.id)).toEqual(['start', 'end']);
    expect(store.canUndo()).toBe(true);

    store.undo();
    store.selectEdge('start__end');
    store.deleteSelection();

    expect(store.edges()).toEqual([]);

    store.loadWorkflow(sampleDetail(), { mode: 'runtime' });
    store.selectNode('start');
    store.deleteSelection();
    store.undo();

    expect(store.nodes().map((node) => node.id)).toEqual(['start', 'end']);
    expect(store.canUndo()).toBe(false);
    expect(store.dirty()).toBe(false);
  });

  it('blocks graph mutations in runtime and readonly modes', () => {
    store.loadWorkflow(sampleDetail(), { mode: 'runtime' });

    store.addNode({ id: 'blocked', type: 'END' }, { x: 1, y: 1 });
    store.connect({ source: 'start', target: 'blocked' });
    store.moveNode('end', { x: 999, y: 999 });
    store.removeNode('start');

    expect(store.nodes().map((node) => node.id)).toEqual(['start', 'end']);
    expect(store.edges()).toEqual([{ source: 'start', target: 'end' }]);
    expect(store.positions()['end']).toEqual({ x: 280, y: 0 });
    expect(store.dirty()).toBe(false);

    store.setMode('readonly');
    store.updateNode('end', { id: 'end', type: 'START' });

    expect(store.nodes()[1]).toEqual({ id: 'end', type: 'END' });
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
        definition: {
          nodes: [
            { id: 'start', type: 'START' },
            { id: 'end', type: 'END' },
          ],
          edges: [{ source: 'start', target: 'end' }],
        },
        runtime: { maxParallel: 1 },
        compiledPlan: null,
        editor: {
          viewport: { x: 10, y: 20, zoom: 0.75 },
          nodes: {
            start: { x: 0, y: 0 },
            end: { x: 280, y: 0 },
          },
        },
      },
    ],
  };
}
