import {
  AiGateWorkflowNode,
  CodeGateWorkflowNode,
  EndWorkflowNode,
  LogicWorkflowNode,
  LogicOperator,
  StartWorkflowNode,
  WorkflowNode,
  WorkflowNodeExecutionStatus,
  WorkflowNodeType,
  WorkflowValidationSeverity,
} from './workflow-studio.model';

export type WorkflowPortDirection = 'in' | 'out';
export type WorkflowNodeShape = 'capsule' | 'rectangle' | 'diamond';
export type WorkflowNodeTone = 'success' | 'info' | 'primary' | 'warning' | 'muted';

export interface WorkflowNodePort {
  id: string;
  direction: WorkflowPortDirection;
  label: string;
}

export interface WorkflowNodeCatalogItem {
  type: WorkflowNodeType;
  title: string;
  description: string;
  iconLabel: string;
  shape: WorkflowNodeShape;
  tone: WorkflowNodeTone;
  defaultSize: { width: number; height: number };
  ports: WorkflowNodePort[];
  allowConnectFrom: boolean;
  allowConnectTo: boolean;
}

export interface WorkflowNodeView {
  id: string;
  type: WorkflowNodeType;
  title: string;
  subtitle: string;
  iconLabel: string;
  ports: WorkflowNodePort[];
  selected: boolean;
  runtimeStatus: WorkflowNodeExecutionStatus | null;
  validationSeverity: WorkflowValidationSeverity | null;
}

export interface WorkflowNodeViewOptions {
  selected?: boolean;
  runtimeStatus?: WorkflowNodeExecutionStatus | null;
  validationSeverity?: WorkflowValidationSeverity | null;
}

const WORKFLOW_NODE_CATALOG: Record<WorkflowNodeType, WorkflowNodeCatalogItem> = {
  START: {
    type: 'START',
    title: 'Start',
    description: 'Workflow entry point',
    iconLabel: 'ST',
    shape: 'capsule',
    tone: 'success',
    defaultSize: { width: 180, height: 64 },
    ports: [{ id: 'out', direction: 'out', label: 'Out' }],
    allowConnectFrom: true,
    allowConnectTo: false,
  },
  CODE_GATE: {
    type: 'CODE_GATE',
    title: 'Code Gate',
    description: 'Deterministic gate logic',
    iconLabel: 'CG',
    shape: 'rectangle',
    tone: 'info',
    defaultSize: { width: 220, height: 76 },
    ports: defaultMiddlePorts(),
    allowConnectFrom: true,
    allowConnectTo: true,
  },
  AI_GATE: {
    type: 'AI_GATE',
    title: 'AI Gate',
    description: 'AI model gate',
    iconLabel: 'AI',
    shape: 'rectangle',
    tone: 'primary',
    defaultSize: { width: 240, height: 84 },
    ports: defaultMiddlePorts(),
    allowConnectFrom: true,
    allowConnectTo: true,
  },
  LOGIC: {
    type: 'LOGIC',
    title: 'Logic',
    description: 'Outcome combiner',
    iconLabel: 'LG',
    shape: 'diamond',
    tone: 'warning',
    defaultSize: { width: 190, height: 90 },
    ports: defaultMiddlePorts(),
    allowConnectFrom: true,
    allowConnectTo: true,
  },
  END: {
    type: 'END',
    title: 'End',
    description: 'Workflow terminal point',
    iconLabel: 'EN',
    shape: 'capsule',
    tone: 'muted',
    defaultSize: { width: 180, height: 64 },
    ports: [{ id: 'in', direction: 'in', label: 'In' }],
    allowConnectFrom: false,
    allowConnectTo: true,
  },
};

export function workflowNodeCatalogItems(): WorkflowNodeCatalogItem[] {
  return Object.values(WORKFLOW_NODE_CATALOG).map(cloneCatalogItem);
}

export function workflowNodeCatalogItem(type: WorkflowNodeType): WorkflowNodeCatalogItem {
  return cloneCatalogItem(WORKFLOW_NODE_CATALOG[type]);
}

export function workflowNodePorts(type: WorkflowNodeType): WorkflowNodePort[] {
  return WORKFLOW_NODE_CATALOG[type].ports.map((port) => ({ ...port }));
}

export function createWorkflowNode(type: 'START', id: string): StartWorkflowNode;
export function createWorkflowNode(type: 'CODE_GATE', id: string): CodeGateWorkflowNode;
export function createWorkflowNode(type: 'AI_GATE', id: string): AiGateWorkflowNode;
export function createWorkflowNode(type: 'LOGIC', id: string): LogicWorkflowNode;
export function createWorkflowNode(type: 'END', id: string): EndWorkflowNode;
export function createWorkflowNode(type: WorkflowNodeType, id: string): WorkflowNode;
export function createWorkflowNode(type: WorkflowNodeType, id: string): WorkflowNode {
  switch (type) {
    case 'START':
      return { id, type: 'START' };
    case 'END':
      return { id, type: 'END' };
    case 'CODE_GATE':
      return {
        id,
        type: 'CODE_GATE',
        handler: '',
        config: {},
        inputMapping: { mapping: {} },
        retryPolicy: { maxAttempts: 1 },
        timeoutPolicy: { timeoutSeconds: 30 },
      };
    case 'AI_GATE':
      return {
        id,
        type: 'AI_GATE',
        instruction: '',
        criteria: {},
        inputMapping: { mapping: {} },
        provider: '',
        modelProfile: '',
        toolProfile: '',
        outputSchema: '',
        retryPolicy: { maxAttempts: 1 },
        timeoutPolicy: { timeoutSeconds: 30 },
      };
    case 'LOGIC':
      return { id, type: 'LOGIC', operator: 'AND', config: {} };
  }
}

export function createWorkflowNodeId(type: WorkflowNodeType, existingIds: string[]): string {
  const prefix = type.toLowerCase().replaceAll('_', '-');
  const usedIndexes = existingIds
    .map((id) => id.match(new RegExp(`^${prefix}-(\\d+)$`))?.[1])
    .filter((index): index is string => !!index)
    .map(Number);
  const nextIndex = usedIndexes.length ? Math.max(...usedIndexes) + 1 : 1;
  return `${prefix}-${nextIndex}`;
}

export function workflowNodeView(node: WorkflowNode, options: WorkflowNodeViewOptions = {}): WorkflowNodeView {
  const catalogItem = WORKFLOW_NODE_CATALOG[node.type];
  return {
    id: node.id,
    type: node.type,
    title: catalogItem.title,
    subtitle: nodeSubtitle(node),
    iconLabel: catalogItem.iconLabel,
    ports: workflowNodePorts(node.type),
    selected: options.selected ?? false,
    runtimeStatus: options.runtimeStatus ?? null,
    validationSeverity: options.validationSeverity ?? null,
  };
}

function nodeSubtitle(node: WorkflowNode): string {
  switch (node.type) {
    case 'START':
      return 'Entry';
    case 'END':
      return 'Terminal';
    case 'CODE_GATE':
      return node.handler || 'Code handler';
    case 'AI_GATE':
      return node.instruction || [node.provider, node.modelProfile].filter(Boolean).join(' / ') || 'AI evaluation';
    case 'LOGIC':
      return logicLabel(node.operator);
  }
}

function logicLabel(operator: LogicOperator): string {
  return operator.replaceAll('_', ' ');
}

function defaultMiddlePorts(): WorkflowNodePort[] {
  return [
    { id: 'in', direction: 'in', label: 'In' },
    { id: 'out', direction: 'out', label: 'Out' },
  ];
}

function cloneCatalogItem(item: WorkflowNodeCatalogItem): WorkflowNodeCatalogItem {
  return {
    ...item,
    defaultSize: { ...item.defaultSize },
    ports: item.ports.map((port) => ({ ...port })),
  };
}
