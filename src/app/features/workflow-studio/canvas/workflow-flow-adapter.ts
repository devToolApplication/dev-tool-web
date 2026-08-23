import {
  FlowBuilderMode,
  FlowDefinition,
  FlowEdge,
  FlowNode,
  FlowNodeTypeDefinition,
  FlowStatus,
} from '@shared/ui/patterns/flow-builder';

import {
  JsonValue,
  WorkflowEdge,
  WorkflowEditorMode,
  WorkflowEditorViewport,
  WorkflowGraph,
  WorkflowNode,
  WorkflowNodeExecutionStatus,
  WorkflowNodePosition,
  WorkflowRuntimeVisualState,
  WorkflowNodeType,
} from '../model/workflow-studio.model';
import { workflowEdgeId } from '../model/workflow-graph.utils';
import {
  createWorkflowNode,
  workflowNodeCatalogItems,
  workflowNodeView,
} from '../model/workflow-node-catalog';

export type WorkflowCanvasMode = WorkflowEditorMode;

export interface WorkflowFlowDefinitionOptions {
  workflowId?: string;
  workflowName?: string;
  positions?: Record<string, WorkflowNodePosition>;
  viewport?: WorkflowEditorViewport;
  mode?: WorkflowCanvasMode;
  runtimeStatus?: WorkflowRuntimeVisualState;
}

export const WORKFLOW_FLOW_NODE_TYPES: FlowNodeTypeDefinition[] = workflowNodeCatalogItems()
  .map((item) => ({
    type: item.type,
    label: item.title,
    description: item.description,
    shape: item.shape,
    tone: item.tone,
    defaultSize: item.defaultSize,
    ports: item.ports.map((port) => ({
      id: port.id,
      group: port.direction,
      position: port.direction === 'in' ? 'left' : 'right',
      label: port.label,
    })),
    allowConnectFrom: item.allowConnectFrom,
    allowConnectTo: item.allowConnectTo,
    maxIncoming: item.type === 'START' ? 0 : undefined,
    maxOutgoing: item.type === 'END' ? 0 : undefined,
    labelResolver: (node) => workflowNodeView(workflowNodeFromFlowNode(node)).title,
    subtitleResolver: (node) => workflowNodeView(workflowNodeFromFlowNode(node)).subtitle,
    badgeResolver: (node) => {
      const status = node.data?.['runtimeStatus'];
      return typeof status === 'string' ? { label: status, tone: statusToTone(node.status) } : null;
    },
  }));

const NODE_LABELS: Record<WorkflowNodeType, string> = {
  START: 'Start',
  CODE_GATE: 'Code Gate',
  AI_GATE: 'AI Gate',
  LOGIC: 'Logic',
  END: 'End',
};

export function workflowGraphToFlowDefinition(
  graph: WorkflowGraph,
  options: WorkflowFlowDefinitionOptions = {},
): FlowDefinition {
  return {
    id: options.workflowId ?? 'workflow-draft',
    version: 1,
    name: options.workflowName,
    readonly: workflowCanvasReadonly(options.mode ?? 'design'),
    viewport: options.viewport ? { ...options.viewport } : undefined,
    nodes: graph.nodes.map((node, index) => workflowNodeToFlowNode(
      node,
      options.positions?.[node.id],
      index,
      options.runtimeStatus?.nodes?.[node.id],
    )),
    edges: graph.edges.map((edge) => workflowEdgeToFlowEdge(edge, options.runtimeStatus?.edges?.[workflowEdgeId(edge)])),
    metadata: { source: 'workflow-studio' },
  };
}

export function workflowGraphFromFlowDefinition(definition: FlowDefinition): WorkflowGraph {
  return {
    nodes: definition.nodes.map(workflowNodeFromFlowNode),
    edges: definition.edges.map((edge) => ({
      source: edge.source.nodeId,
      target: edge.target.nodeId,
    })),
  };
}

export function workflowPositionsFromFlowDefinition(
  definition: FlowDefinition,
): Record<string, WorkflowNodePosition> {
  return Object.fromEntries(
    definition.nodes
      .filter((node) => !!node.position)
      .map((node) => [node.id, { x: node.position!.x, y: node.position!.y }]),
  );
}

export function workflowViewportFromFlowDefinition(
  definition: FlowDefinition,
): WorkflowEditorViewport | undefined {
  return definition.viewport ? { ...definition.viewport } : undefined;
}

export function workflowCanvasModeToFlowMode(mode: WorkflowCanvasMode): FlowBuilderMode {
  if (mode === 'design') {
    return 'edit';
  }
  if (mode === 'runtime') {
    return 'trace';
  }
  return 'readonly';
}

export function workflowCanvasReadonly(mode: WorkflowCanvasMode): boolean {
  return mode !== 'design';
}

export function workflowNodeExecutionStatusToFlowStatus(status: WorkflowNodeExecutionStatus): FlowStatus {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'ERROR':
    case 'TIMED_OUT':
    case 'CANCELLED':
      return 'danger';
    case 'RUNNING':
    case 'WAITING_EXTERNAL':
      return 'warning';
    case 'SKIPPED':
      return 'muted';
    default:
      return 'default';
  }
}

function workflowNodeToFlowNode(
  node: WorkflowNode,
  position: WorkflowNodePosition | undefined,
  index: number,
  runtimeStatus?: WorkflowNodeExecutionStatus,
): FlowNode {
  const view = workflowNodeView(node, { runtimeStatus: runtimeStatus ?? null });
  return {
    id: node.id,
    type: node.type,
    label: NODE_LABELS[node.type],
    position: position ? { ...position } : { x: index * 280, y: 0 },
    size: WORKFLOW_FLOW_NODE_TYPES.find((type) => type.type === node.type)?.defaultSize,
    ports: flowPortsForNodeType(node.type),
    status: runtimeStatus ? workflowNodeExecutionStatusToFlowStatus(runtimeStatus) : undefined,
    data: {
      workflowNode: cloneWorkflowNode(node),
      subtitle: view.subtitle,
      iconLabel: view.iconLabel,
      runtimeStatus,
    },
  };
}

function workflowEdgeToFlowEdge(edge: WorkflowEdge, runtimeStatus?: WorkflowNodeExecutionStatus): FlowEdge {
  return {
    id: workflowEdgeId(edge),
    source: { nodeId: edge.source, portId: 'out' },
    target: { nodeId: edge.target, portId: 'in' },
    status: runtimeStatus ? workflowNodeExecutionStatusToFlowStatus(runtimeStatus) : undefined,
  };
}

export function workflowNodeFromFlowNode(node: FlowNode): WorkflowNode {
  const workflowNode = node.data?.['workflowNode'];
  if (isWorkflowNode(workflowNode)) {
    return cloneWorkflowNode(workflowNode);
  }
  return fallbackWorkflowNode(node);
}

function flowPortsForNodeType(type: WorkflowNodeType): FlowNode['ports'] {
  if (type === 'START') {
    return [{ id: 'out', group: 'out', position: 'right' }];
  }
  if (type === 'END') {
    return [{ id: 'in', group: 'in', position: 'left' }];
  }
  return [
    { id: 'in', group: 'in', position: 'left' },
    { id: 'out', group: 'out', position: 'right' },
  ];
}

function fallbackWorkflowNode(node: FlowNode): WorkflowNode {
  if (isWorkflowNodeType(node.type)) {
    return createWorkflowNode(node.type, node.id);
  }
  return createWorkflowNode('END', node.id);
}

function isWorkflowNode(value: unknown): value is WorkflowNode {
  if (!isRecord(value) || typeof value['id'] !== 'string' || typeof value['type'] !== 'string') {
    return false;
  }
  return ['START', 'CODE_GATE', 'AI_GATE', 'LOGIC', 'END'].includes(value['type']);
}

function isWorkflowNodeType(value: string): value is WorkflowNodeType {
  return ['START', 'CODE_GATE', 'AI_GATE', 'LOGIC', 'END'].includes(value);
}

function statusToTone(status?: FlowStatus) {
  switch (status) {
    case 'success':
      return 'success';
    case 'danger':
      return 'danger';
    case 'warning':
      return 'warning';
    case 'muted':
      return 'muted';
    default:
      return 'primary';
  }
}

function cloneWorkflowNode<T extends WorkflowNode>(node: T): T {
  return cloneJson(node as unknown as JsonValue) as unknown as T;
}

function cloneJson(value: JsonValue): JsonValue {
  return value === null ? null : JSON.parse(JSON.stringify(value)) as JsonValue;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
