import { computed, Injectable, signal } from '@angular/core';

import {
  WorkflowDetail,
  WorkflowEdge,
  WorkflowEditorMode,
  WorkflowEditorViewport,
  WorkflowGraph,
  WorkflowNode,
  WorkflowNodePosition,
  WorkflowNodeType,
  WorkflowRuntimeConfig,
  WorkflowUpsertPayload,
  WorkflowValidationIssue,
  WorkflowVersion,
} from '../model/workflow-studio.model';
import { workflowEdgeId } from '../model/workflow-graph.utils';
import { createWorkflowNode, createWorkflowNodeId } from '../model/workflow-node-catalog';
import { validateWorkflowConnection } from '../model/workflow-connection.rules';

interface WorkflowEditorSnapshot {
  definition: {
    name: string;
    description: string | null;
  } | null;
  runtime: WorkflowRuntimeConfig | null;
  bpmnXml: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  positions: Record<string, WorkflowNodePosition>;
  viewport: WorkflowEditorViewport;
}

const DEFAULT_VIEWPORT: WorkflowEditorViewport = { x: 0, y: 0, zoom: 1 };

@Injectable()
export class WorkflowEditorStore {
  readonly workflow = signal<WorkflowDetail | null>(null);
  readonly bpmnXml = signal('');
  readonly nodes = signal<WorkflowNode[]>([]);
  readonly edges = signal<WorkflowEdge[]>([]);
  readonly positions = signal<Record<string, WorkflowNodePosition>>({});
  readonly viewport = signal<WorkflowEditorViewport>({ ...DEFAULT_VIEWPORT });
  readonly selectedNodeId = signal<string | null>(null);
  readonly selectedEdgeId = signal<string | null>(null);
  readonly dirty = signal(false);
  readonly saving = signal(false);
  readonly validationIssues = signal<WorkflowValidationIssue[]>([]);
  readonly focusedValidationIssue = signal<WorkflowValidationIssue | null>(null);
  readonly mode = signal<WorkflowEditorMode>('design');
  readonly graph = computed<WorkflowGraph>(() => ({
    nodes: this.nodes(),
    edges: this.edges(),
  }));
  readonly canUndo = computed(() => this.undoStack().length > 0 && this.canMutate());
  readonly canRedo = computed(() => this.redoStack().length > 0 && this.canMutate());

  private readonly savedSnapshot = signal<WorkflowEditorSnapshot | null>(null);
  private readonly undoStack = signal<WorkflowEditorSnapshot[]>([]);
  private readonly redoStack = signal<WorkflowEditorSnapshot[]>([]);

  loadWorkflow(
    detail: WorkflowDetail,
    options: { versionId?: string; mode?: WorkflowEditorMode } = {},
  ): void {
    const version = selectEditorVersion(detail, options.versionId);
    const snapshot: WorkflowEditorSnapshot = {
      definition: {
        name: detail.definition.name,
        description: detail.definition.description,
      },
      runtime: version.runtime ? { ...version.runtime } : null,
      bpmnXml: version.bpmnXml,
      nodes: [],
      edges: [],
      positions: {},
      viewport: { ...DEFAULT_VIEWPORT },
    };

    this.mode.set(options.mode ?? 'design');
    this.workflow.set(cloneWorkflowDetail(detail));
    this.restoreSnapshot(snapshot);
    this.dirty.set(false);
    this.saving.set(false);
    this.selectedNodeId.set(null);
    this.selectedEdgeId.set(null);
    this.validationIssues.set([]);
    this.focusedValidationIssue.set(null);
    this.savedSnapshot.set(cloneSnapshot(snapshot));
    this.undoStack.set([]);
    this.redoStack.set([]);
  }

  setMode(mode: WorkflowEditorMode): void {
    this.mode.set(mode);
  }

  updateBpmnXml(bpmnXml: string): void {
    if (!this.canMutate() || this.bpmnXml() === bpmnXml) return;
    this.captureHistory();
    this.bpmnXml.set(bpmnXml);
    this.updateActiveVersion({ bpmnXml });
    this.markDirty();
  }

  addNode(node: WorkflowNode, position: WorkflowNodePosition): void {
    if (!this.canMutate()) return;
    this.captureHistory();
    this.nodes.update((nodes) => [...nodes, cloneNode(node)]);
    this.positions.update((positions) => ({ ...positions, [node.id]: { ...position } }));
    this.selectNode(node.id);
    this.markDirty();
  }

  addNodeByType(type: WorkflowNodeType, position: WorkflowNodePosition): WorkflowNode {
    const node = createWorkflowNode(
      type,
      createWorkflowNodeId(
        type,
        this.nodes().map((item) => item.id),
      ),
    );
    this.addNode(node, position);
    return cloneNode(node);
  }

  removeNode(nodeId: string): void {
    if (!this.canMutate()) return;
    if (!this.nodes().some((node) => node.id === nodeId)) return;
    this.captureHistory();
    this.nodes.update((nodes) => nodes.filter((node) => node.id !== nodeId));
    this.edges.update((edges) =>
      edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    );
    this.positions.update((positions) => {
      const next = { ...positions };
      delete next[nodeId];
      return next;
    });
    if (this.selectedNodeId() === nodeId) {
      this.selectedNodeId.set(null);
    }
    if (this.selectedEdgeId()?.includes(nodeId)) {
      this.selectedEdgeId.set(null);
    }
    this.markDirty();
  }

  moveNode(nodeId: string, position: WorkflowNodePosition): void {
    if (!this.canMutate()) return;
    if (!this.nodes().some((node) => node.id === nodeId)) return;
    this.captureHistory();
    this.positions.update((positions) => ({ ...positions, [nodeId]: { ...position } }));
    this.markDirty();
  }

  setViewport(viewport: WorkflowEditorViewport): void {
    if (!this.canMutate()) return;
    if (sameJson(this.viewport(), viewport)) return;
    this.viewport.set({ ...viewport });
  }

  connect(edge: WorkflowEdge): void {
    if (!this.canMutate()) return;
    if (this.edges().some((item) => workflowEdgeId(item) === workflowEdgeId(edge))) return;
    const issues = validateWorkflowConnection(this.graph(), edge);
    if (issues.length) {
      this.validationIssues.set(issues);
      return;
    }
    this.captureHistory();
    this.edges.update((edges) => [...edges, { ...edge }]);
    this.selectedEdgeId.set(workflowEdgeId(edge));
    this.validationIssues.set([]);
    this.markDirty();
  }

  reconnect(edgeId: string, edge: WorkflowEdge): void {
    if (!this.canMutate()) return;
    if (!this.edges().some((item) => workflowEdgeId(item) === edgeId)) return;
    const graphWithoutCurrentEdge: WorkflowGraph = {
      nodes: this.nodes(),
      edges: this.edges().filter((item) => workflowEdgeId(item) !== edgeId),
    };
    const issues = validateWorkflowConnection(graphWithoutCurrentEdge, edge, {
      existingEdgeId: edgeId,
    });
    if (issues.length) {
      this.validationIssues.set(issues);
      return;
    }
    this.captureHistory();
    this.edges.update((edges) =>
      edges.map((item) => (workflowEdgeId(item) === edgeId ? { ...edge } : item)),
    );
    this.selectedEdgeId.set(workflowEdgeId(edge));
    this.validationIssues.set([]);
    this.markDirty();
  }

  disconnect(edgeId: string): void {
    if (!this.canMutate()) return;
    if (!this.edges().some((item) => workflowEdgeId(item) === edgeId)) return;
    this.captureHistory();
    this.edges.update((edges) => edges.filter((edge) => workflowEdgeId(edge) !== edgeId));
    if (this.selectedEdgeId() === edgeId) {
      this.selectedEdgeId.set(null);
    }
    this.markDirty();
  }

  selectNode(nodeId: string | null): void {
    this.selectedNodeId.set(nodeId);
    if (nodeId) {
      this.selectedEdgeId.set(null);
    }
  }

  selectEdge(edgeId: string | null): void {
    this.selectedEdgeId.set(edgeId);
    if (edgeId) {
      this.selectedNodeId.set(null);
    }
  }

  updateNode(nodeId: string, node: WorkflowNode): void {
    if (!this.canMutate()) return;
    if (!this.nodes().some((item) => item.id === nodeId)) return;
    this.captureHistory();
    this.nodes.update((nodes) =>
      nodes.map((item) => (item.id === nodeId ? cloneNode(node) : item)),
    );
    this.markDirty();
  }

  updateNodePatch(nodeId: string, patch: Partial<WorkflowNode>): void {
    if (!this.canMutate()) return;
    const current = this.nodes().find((node) => node.id === nodeId);
    if (!current) return;
    const next = mergeNodePatch(current, patch);
    if (sameJson(current, next)) return;
    this.captureHistory();
    this.nodes.update((nodes) => nodes.map((node) => (node.id === nodeId ? next : node)));
    this.markDirty();
  }

  updateEdge(edgeId: string, edge: WorkflowEdge): void {
    if (!this.canMutate()) return;
    if (!this.edges().some((item) => workflowEdgeId(item) === edgeId)) return;
    this.captureHistory();
    this.edges.update((edges) =>
      edges.map((item) => (workflowEdgeId(item) === edgeId ? cloneEdge(edge) : item)),
    );
    this.selectedEdgeId.set(workflowEdgeId(edge));
    this.markDirty();
  }

  replaceGraph(graph: WorkflowGraph): void {
    if (!this.canMutate()) return;
    if (sameJson(this.graph(), graph)) return;
    this.captureHistory();
    this.nodes.set(cloneNodes(graph.nodes));
    this.edges.set(cloneEdges(graph.edges));
    this.markDirty();
  }

  replaceGraphForEngine(
    _engineKind: string,
    graph: WorkflowGraph,
    positions: Record<string, WorkflowNodePosition>,
  ): void {
    this.replaceGraph(graph);
    this.positions.set(clonePositions(positions));
  }

  applyLayout(positions: Record<string, WorkflowNodePosition>): void {
    if (!this.canMutate()) return;
    if (sameJson(this.positions(), positions)) return;
    this.captureHistory();
    this.positions.set(clonePositions(positions));
    this.markDirty();
  }

  reset(): void {
    const snapshot = this.savedSnapshot();
    if (!snapshot) return;
    this.restoreSnapshot(snapshot);
    this.selectedNodeId.set(null);
    this.selectedEdgeId.set(null);
    this.focusedValidationIssue.set(null);
    this.dirty.set(false);
    this.undoStack.set([]);
    this.redoStack.set([]);
  }

  markSaved(): void {
    this.savedSnapshot.set(this.currentSnapshot());
    this.syncDirty();
  }

  setSaving(saving: boolean): void {
    this.saving.set(saving);
  }

  setValidationIssues(issues: WorkflowValidationIssue[]): void {
    this.validationIssues.set(issues.map((issue) => ({ ...issue })));
  }

  selectValidationIssue(issue: WorkflowValidationIssue): void {
    this.focusedValidationIssue.set({ ...issue });
    if (issue.edgeId && !issue.nodeId) {
      this.selectEdge(issue.edgeId);
      return;
    }
    this.selectNode(issue.nodeId ?? issue.elementId ?? null);
  }

  deleteSelection(): void {
    if (!this.canMutate()) return;
    const nodeId = this.selectedNodeId();
    if (nodeId) {
      this.removeNode(nodeId);
      return;
    }
    const edgeId = this.selectedEdgeId();
    if (edgeId) {
      this.disconnect(edgeId);
    }
  }

  duplicateSelectedNode(): void {
    if (!this.canMutate()) return;
    const selectedId = this.selectedNodeId();
    if (!selectedId) return;
    const originalNode = this.nodes().find((node) => node.id === selectedId);
    if (!originalNode) return;

    this.captureHistory();
    const newId = createWorkflowNodeId(
      originalNode.type,
      this.nodes().map((item) => item.id),
    );
    const cloned = { ...cloneNode(originalNode), id: newId };
    const currentPos = this.positions()[selectedId] ?? { x: 0, y: 0 };
    const newPosition: WorkflowNodePosition = { x: currentPos.x + 32, y: currentPos.y + 32 };
    this.nodes.update((nodes) => [...nodes, cloned]);
    this.positions.update((positions) => ({ ...positions, [newId]: newPosition }));
    this.selectNode(newId);
    this.markDirty();
  }

  undo(): void {
    if (!this.canMutate()) return;
    const previous = this.undoStack().at(-1);
    if (!previous) return;
    this.undoStack.update((items) => items.slice(0, -1));
    this.redoStack.update((items) => [...items, this.currentSnapshot()]);
    this.restoreSnapshot(previous);
    this.selectedNodeId.set(null);
    this.selectedEdgeId.set(null);
    this.syncDirty();
  }

  redo(): void {
    if (!this.canMutate()) return;
    const next = this.redoStack().at(-1);
    if (!next) return;
    this.redoStack.update((items) => items.slice(0, -1));
    this.undoStack.update((items) => [...items, this.currentSnapshot()]);
    this.restoreSnapshot(next);
    this.selectedNodeId.set(null);
    this.selectedEdgeId.set(null);
    this.syncDirty();
  }

  updateWorkflowMetadata(name: string, description: string | null): void {
    if (!this.canMutate()) return;
    const workflow = this.workflow();
    if (!workflow) return;
    if (workflow.definition.name === name && workflow.definition.description === description)
      return;
    this.captureHistory();
    this.workflow.set({
      ...cloneWorkflowDetail(workflow),
      definition: {
        ...workflow.definition,
        name,
        description,
      },
    });
    this.markDirty();
  }

  updateRuntime(runtime: WorkflowRuntimeConfig | null): void {
    if (!this.canMutate()) return;
    const workflow = this.workflow();
    if (!workflow) return;
    const version = selectEditorVersion(workflow);
    if (sameJson(version.runtime, runtime)) return;
    this.captureHistory();
    this.updateActiveVersion({ runtime: runtime ? { ...runtime } : null });
    this.markDirty();
  }

  toUpsertPayload(): WorkflowUpsertPayload {
    const workflow = this.workflow();
    if (!workflow) {
      throw new Error('Workflow detail is required before saving');
    }
    const version = selectEditorVersion(workflow);
    return {
      name: workflow.definition.name,
      description: workflow.definition.description,
      bpmnXml: this.bpmnXml(),
      runtime: version.runtime ? { ...version.runtime } : null,
    };
  }

  private canMutate(): boolean {
    return this.mode() === 'design';
  }

  private markDirty(): void {
    this.dirty.set(true);
  }

  private captureHistory(): void {
    this.undoStack.update((items) => [...items, this.currentSnapshot()]);
    this.redoStack.set([]);
  }

  private syncDirty(): void {
    const saved = this.savedSnapshot();
    this.dirty.set(saved ? !sameEditableSnapshot(this.currentSnapshot(), saved) : false);
  }

  private currentSnapshot(): WorkflowEditorSnapshot {
    const workflow = this.workflow();
    const version = workflow ? selectEditorVersion(workflow) : null;
    return {
      definition: workflow
        ? {
            name: workflow.definition.name,
            description: workflow.definition.description,
          }
        : null,
      runtime: version?.runtime ? { ...version.runtime } : null,
      bpmnXml: this.bpmnXml(),
      nodes: cloneNodes(this.nodes()),
      edges: cloneEdges(this.edges()),
      positions: clonePositions(this.positions()),
      viewport: { ...this.viewport() },
    };
  }

  private restoreSnapshot(snapshot: WorkflowEditorSnapshot): void {
    const copy = cloneSnapshot(snapshot);
    const workflow = this.workflow();
    if (workflow && copy.definition) {
      const version = selectEditorVersion(workflow);
      this.workflow.set({
        ...cloneWorkflowDetail(workflow),
        definition: {
          ...workflow.definition,
          name: copy.definition.name,
          description: copy.definition.description,
        },
        versions: workflow.versions.map((item) =>
          item.id === version.id
            ? {
                ...item,
                runtime: copy.runtime ? { ...copy.runtime } : null,
                bpmnXml: copy.bpmnXml,
              }
            : item,
        ),
      });
    }
    this.bpmnXml.set(copy.bpmnXml);
    this.nodes.set(copy.nodes);
    this.edges.set(copy.edges);
    this.positions.set(copy.positions);
    this.viewport.set(copy.viewport);
  }

  private updateActiveVersion(patch: Partial<WorkflowVersion>): void {
    const workflow = this.workflow();
    if (!workflow) return;
    const version = selectEditorVersion(workflow);
    this.workflow.set({
      ...cloneWorkflowDetail(workflow),
      versions: workflow.versions.map((item) =>
        item.id === version.id ? { ...item, ...cloneJson(patch) } : item,
      ),
    });
  }
}

function selectEditorVersion(detail: WorkflowDetail, versionId?: string): WorkflowVersion {
  const version =
    detail.versions.find((item) => item.id === versionId) ??
    detail.versions.find((item) => item.id === detail.definition.currentDraftVersionId) ??
    detail.versions.find((item) => item.status === 'DRAFT') ??
    detail.versions[0];

  if (!version) {
    throw new Error('Workflow detail has no version to edit');
  }

  return version;
}

function cloneSnapshot(snapshot: WorkflowEditorSnapshot): WorkflowEditorSnapshot {
  return {
    definition: snapshot.definition ? { ...snapshot.definition } : null,
    runtime: snapshot.runtime ? { ...snapshot.runtime } : null,
    bpmnXml: snapshot.bpmnXml,
    nodes: cloneNodes(snapshot.nodes),
    edges: cloneEdges(snapshot.edges),
    positions: clonePositions(snapshot.positions),
    viewport: { ...snapshot.viewport },
  };
}

function sameEditableSnapshot(
  left: WorkflowEditorSnapshot,
  right: WorkflowEditorSnapshot,
): boolean {
  return sameJson(
    {
      definition: left.definition,
      runtime: left.runtime,
      bpmnXml: left.bpmnXml,
      nodes: left.nodes,
      edges: left.edges,
      positions: left.positions,
    },
    {
      definition: right.definition,
      runtime: right.runtime,
      bpmnXml: right.bpmnXml,
      nodes: right.nodes,
      edges: right.edges,
      positions: right.positions,
    },
  );
}

function cloneWorkflowDetail(detail: WorkflowDetail): WorkflowDetail {
  return cloneJson(detail);
}

function cloneNodes(nodes: WorkflowNode[]): WorkflowNode[] {
  return nodes.map(cloneNode);
}

function cloneNode<T extends WorkflowNode>(node: T): T {
  return cloneJson(node);
}

function mergeNodePatch<T extends WorkflowNode>(node: T, patch: Partial<WorkflowNode>): T {
  const next = {
    ...cloneNode(node),
    ...cloneJson(patch),
    id: node.id,
    type: node.type,
  };
  return next as T;
}

function cloneEdges(edges: WorkflowEdge[]): WorkflowEdge[] {
  return cloneJson(edges);
}

function cloneEdge(edge: WorkflowEdge): WorkflowEdge {
  return cloneJson(edge);
}

function clonePositions(
  positions: Record<string, WorkflowNodePosition>,
): Record<string, WorkflowNodePosition> {
  return Object.fromEntries(
    Object.entries(positions).map(([id, position]) => [id, { ...position }]),
  );
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
