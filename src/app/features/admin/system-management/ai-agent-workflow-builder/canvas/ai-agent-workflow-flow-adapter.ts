import type { FormConfig } from '../../../../../shared/ui/form-input/models/form-config.model';
import type {
  FlowDefinition,
  FlowEdge,
  FlowNode,
  FlowNodeTypeDefinition,
  FlowToolbarConfig,
  FlowCapabilities,
  FlowValidationIssue,
} from '../../../../../shared/ui/flow-builder/models';
import {
  LOGIC_CODES,
  NODE_PALETTE,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeType,
} from '../../../../../core/models/ai-agent/ai-agent-workflow.model';

const DEFAULT_NODE_SIZE: Record<WorkflowNodeType, { width: number; height: number }> = {
  AI_AGENT_STEP: { width: 250, height: 84 },
  LOGIC_STEP: { width: 238, height: 84 },
  BRANCH_NODE: { width: 220, height: 84 },
  REVIEW_NODE: { width: 238, height: 84 },
  END_NODE: { width: 176, height: 64 },
};

const DEFAULT_NODE_DATA: Record<WorkflowNodeType, Record<string, unknown>> = {
  AI_AGENT_STEP: {
    agentConfigId: '',
    promptTemplate: '',
    timeoutMs: 60000,
    maxRetries: 0,
  },
  LOGIC_STEP: {
    logicCode: '',
    params: {},
    timeoutMs: 30000,
    maxRetries: 0,
  },
  BRANCH_NODE: {},
  REVIEW_NODE: {
    instructions: '',
    autoApproveTimeoutMinutes: 0,
  },
  END_NODE: {},
};

const INTERNAL_DATA_KEYS = new Set(['workflowType', 'rawConfig', 'configParseError']);
const WORKFLOW_NODE_TYPES = new Set<WorkflowNodeType>([
  'AI_AGENT_STEP',
  'LOGIC_STEP',
  'BRANCH_NODE',
  'REVIEW_NODE',
  'END_NODE',
]);

export interface WorkflowFlowInput {
  id: string;
  name?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowFlowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export const AI_AGENT_WORKFLOW_FLOW_TOOLBAR: FlowToolbarConfig = {
  visible: true,
  mode: 'inline',
  commands: [
    'undo',
    'redo',
    'fit',
    'zoomIn',
    'zoomOut',
    'resetZoom',
    'autoLayout',
    'toggleInspector',
    'fullscreen',
    'duplicateSelection',
    'deleteSelection',
    'exportJson',
    'importJson',
  ],
};

export const AI_AGENT_WORKFLOW_FLOW_CAPABILITIES: FlowCapabilities = {
  history: true,
  importExport: true,
  navigator: false,
  inspector: true,
  fullscreen: true,
  autoLayout: true,
  deleteSelection: true,
  duplicateSelection: true,
  contextActions: true,
};

export function createAiAgentWorkflowNodeTypes(): FlowNodeTypeDefinition[] {
  return NODE_PALETTE.map(item => ({
    type: item.type,
    label: item.label,
    description: item.description,
    icon: item.icon,
    shape: item.type === 'BRANCH_NODE' ? 'diamond' : 'rectangle',
    defaultSize: DEFAULT_NODE_SIZE[item.type],
    defaultData: () => ({ ...DEFAULT_NODE_DATA[item.type], workflowType: item.type }),
    tone: nodeTone(item.type),
    allowConnectFrom: item.type !== 'END_NODE',
    allowConnectTo: true,
    ports: item.type === 'END_NODE'
      ? [{ id: 'in', group: 'in', position: 'top' }]
      : [
          { id: 'in', group: 'in', position: 'top' },
          { id: 'out', group: 'out', position: 'bottom' },
        ],
    labelResolver: node => node.label ?? item.label,
    subtitleResolver: node => workflowNodeSubtitle(node, item.type),
    badgeResolver: () => nodeBadge(item.type),
    inspectorForm: workflowNodeInspectorForm(item.type),
  }));
}

export function workflowGraphToFlowDefinition(input: WorkflowFlowInput): FlowDefinition {
  const normalizedEdges = normalizeWorkflowEdges(input.nodes, input.edges);

  return {
    id: input.id,
    version: 1,
    name: input.name,
    nodes: input.nodes.map(workflowNodeToFlowNode),
    edges: normalizedEdges.map(workflowEdgeToFlowEdge),
    metadata: { source: 'ai-agent-workflow' },
  };
}

export function flowDefinitionToWorkflowGraph(definition: FlowDefinition): WorkflowFlowGraph {
  const normalized = normalizeWorkflowFlowDefinition(definition);
  const nodes = normalized.nodes.map(flowNodeToWorkflowNode);
  return {
    nodes,
    edges: normalizeWorkflowEdges(nodes, normalized.edges.map(flowEdgeToWorkflowEdge)),
  };
}

export function normalizeWorkflowFlowDefinition(definition: FlowDefinition): FlowDefinition {
  const nodeTypes = createAiAgentWorkflowNodeTypes();
  const nodeTypeMap = new Map(nodeTypes.map(type => [type.type, type]));
  const nodes = definition.nodes
    .filter(node => isWorkflowNodeType(node.type))
    .map(node => {
      const typeDef = nodeTypeMap.get(node.type);
      return {
        ...node,
        label: node.label || typeDef?.label || node.type,
        size: node.size ?? typeDef?.defaultSize,
        data: {
          ...resolveDefaultData(node.type as WorkflowNodeType),
          ...(node.data ?? {}),
          workflowType: node.type,
        },
      };
    });

  const nodeIds = new Set(nodes.map(node => node.id));
  const nodeTypeById = new Map(nodes.map(node => [node.id, node.type as WorkflowNodeType]));
  const seenPairs = new Set<string>();
  const edges: FlowEdge[] = [];

  for (const edge of definition.edges) {
    const sourceId = edge.source.nodeId;
    const targetId = edge.target.nodeId;
    if (!sourceId || !targetId || sourceId === targetId) continue;
    if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) continue;
    if (nodeTypeById.get(sourceId) === 'END_NODE') continue;

    const pairKey = `${sourceId}->${targetId}`;
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);

    const condition = stringData(edge.data?.['condition']);
    edges.push({
      ...edge,
      source: { nodeId: sourceId, portId: edge.source.portId || 'out' },
      target: { nodeId: targetId, portId: edge.target.portId || 'in' },
      label: edge.label || condition || undefined,
      data: {
        ...(edge.data ?? {}),
        condition: condition ?? '',
      },
    });
  }

  return { ...definition, nodes, edges };
}

export function normalizeWorkflowEdges(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowEdge[] {
  const nodeIds = new Set(nodes.map(node => node.id));
  const nodeTypeById = new Map(nodes.map(node => [node.id, node.type]));
  const seenPairs = new Set<string>();
  const normalized: WorkflowEdge[] = [];

  for (const edge of edges) {
    if (!edge.source || !edge.target || edge.source === edge.target) continue;
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    if (nodeTypeById.get(edge.source) === 'END_NODE') continue;

    const pairKey = `${edge.source}->${edge.target}`;
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);
    normalized.push(edge);
  }

  return normalized;
}

export function workflowValidationIssues(errors: string[]): FlowValidationIssue[] {
  return errors.map(message => ({
    message,
    severity: 'error',
  }));
}

export function workflowNodeSubtitle(node: FlowNode, type: WorkflowNodeType): string {
  switch (type) {
    case 'AI_AGENT_STEP':
      return stringData(node.data?.['agentConfigId']) || 'Agent config required';
    case 'LOGIC_STEP':
      return logicCodeLabel(stringData(node.data?.['logicCode'])) || 'Logic code required';
    case 'BRANCH_NODE':
      return 'Conditional routing';
    case 'REVIEW_NODE':
      return stringData(node.data?.['instructions']) || 'Human approval step';
    case 'END_NODE':
      return 'Workflow completes';
    default:
      return '';
  }
}

export function logicCodeLabel(value: string | null | undefined): string {
  if (!value) return '';
  return LOGIC_CODES.find(code => code.value === value)?.label ?? value;
}

export function workflowNodeTypeLabel(type: WorkflowNodeType): string {
  return NODE_PALETTE.find(item => item.type === type)?.label ?? type;
}

export function workflowNodeIcon(type: WorkflowNodeType): string {
  return NODE_PALETTE.find(item => item.type === type)?.icon ?? 'pi pi-circle';
}

function workflowNodeToFlowNode(node: WorkflowNode): FlowNode {
  const type = isWorkflowNodeType(node.type) ? node.type : 'LOGIC_STEP';
  const parsed = parseWorkflowConfig(node.config);
  return {
    id: node.id,
    type,
    label: node.name || workflowNodeTypeLabel(type),
    position: node.position,
    size: DEFAULT_NODE_SIZE[type],
    data: {
      ...resolveDefaultData(type),
      ...parsed.data,
      workflowType: type,
      ...(parsed.rawConfig ? { rawConfig: parsed.rawConfig, configParseError: true } : {}),
    },
  };
}

function flowNodeToWorkflowNode(node: FlowNode): WorkflowNode {
  const type = isWorkflowNodeType(node.type) ? node.type : 'LOGIC_STEP';
  return {
    id: node.id,
    type,
    name: node.label || workflowNodeTypeLabel(type),
    config: serializeWorkflowConfig(node),
    position: node.position,
  };
}

function workflowEdgeToFlowEdge(edge: WorkflowEdge): FlowEdge {
  const condition = edge.condition ?? '';
  return {
    id: edge.id,
    source: { nodeId: edge.source, portId: 'out' },
    target: { nodeId: edge.target, portId: 'in' },
    label: edge.label || condition || undefined,
    data: { condition },
  };
}

function flowEdgeToWorkflowEdge(edge: FlowEdge): WorkflowEdge {
  const condition = stringData(edge.data?.['condition']) ?? edge.label ?? '';
  return {
    id: edge.id,
    source: edge.source.nodeId,
    target: edge.target.nodeId,
    condition: condition || undefined,
    label: edge.label || condition || undefined,
  };
}

function parseWorkflowConfig(config: string | undefined): { data: Record<string, unknown>; rawConfig?: string } {
  if (!config?.trim()) {
    return { data: {} };
  }

  try {
    const parsed = JSON.parse(config) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { data: parsed as Record<string, unknown> };
    }
    return { data: { value: parsed } };
  } catch {
    return { data: {}, rawConfig: config };
  }
}

function serializeWorkflowConfig(node: FlowNode): string | undefined {
  const data = node.data ?? {};
  const config: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (INTERNAL_DATA_KEYS.has(key)) continue;
    if (value === undefined) continue;
    config[key] = normalizeConfigValue(key, value);
  }

  const keys = Object.keys(config);
  if (keys.length === 0) {
    const rawConfig = stringData(data['rawConfig']);
    return data['configParseError'] === true && rawConfig ? rawConfig : undefined;
  }

  return JSON.stringify(config);
}

function normalizeConfigValue(key: string, value: unknown): unknown {
  if (key !== 'params' || typeof value !== 'string') {
    return value;
  }

  try {
    return value.trim() ? JSON.parse(value) : {};
  } catch {
    return value;
  }
}

function workflowNodeInspectorForm(type: WorkflowNodeType): FormConfig {
  const fields: FormConfig['fields'] = [
    {
      name: 'node',
      type: 'group',
      label: 'Node',
      children: [
        {
          name: 'label',
          type: 'text',
          label: 'Node name',
          required: true,
          placeholder: workflowNodeTypeLabel(type),
        },
      ],
    },
  ];

  if (type === 'AI_AGENT_STEP') {
    fields.push(
      {
        name: 'agentConfigId',
        type: 'text',
        label: 'Agent Config ID',
        required: true,
        placeholder: 'agent-config-id',
      },
      {
        name: 'promptTemplate',
        type: 'textarea',
        label: 'Prompt Template',
        rows: 5,
        maxRows: 10,
        placeholder: 'Use #{#input.field} or #{#results.nodeId.field}',
      },
      timeoutField(60000),
      retryField()
    );
  } else if (type === 'LOGIC_STEP') {
    fields.push(
      {
        name: 'logicCode',
        type: 'select',
        label: 'Logic Code',
        required: true,
        options: LOGIC_CODES,
        placeholder: 'Select logic code',
      },
      {
        name: 'params',
        type: 'json',
        label: 'Params',
        rows: 7,
        maxRows: 12,
        showZoomButton: true,
        contentType: 'json',
        placeholder: '{"key":"value"}',
      },
      timeoutField(30000),
      retryField()
    );
  } else if (type === 'BRANCH_NODE') {
    fields.push({
      name: 'routingNote',
      type: 'textarea',
      label: 'Routing note',
      rows: 3,
      maxRows: 6,
      placeholder: 'Describe branch routing. Conditions live on outgoing edges.',
    });
  } else if (type === 'REVIEW_NODE') {
    fields.push(
      {
        name: 'instructions',
        type: 'textarea',
        label: 'Review instructions',
        rows: 4,
        maxRows: 8,
      },
      {
        name: 'autoApproveTimeoutMinutes',
        type: 'number',
        label: 'Auto-approve timeout',
        suffix: 'minutes',
        step: 1,
      }
    );
  }

  return {
    fields,
    layout: {
      mode: 'simple',
      density: 'compact',
      labelPlacement: 'top',
      sectionNavigation: 'none',
      showValidationSummary: true,
    },
  };
}

function timeoutField(defaultValue: number): FormConfig['fields'][number] {
  return {
    name: 'timeoutMs',
    type: 'number',
    label: 'Timeout',
    suffix: 'ms',
    step: 1000,
    helpText: `Default ${defaultValue} ms`,
  };
}

function retryField(): FormConfig['fields'][number] {
  return {
    name: 'maxRetries',
    type: 'number',
    label: 'Max retries',
    step: 1,
  };
}

function resolveDefaultData(type: WorkflowNodeType): Record<string, unknown> {
  return { ...DEFAULT_NODE_DATA[type] };
}

function nodeTone(type: WorkflowNodeType): FlowNodeTypeDefinition['tone'] {
  switch (type) {
    case 'AI_AGENT_STEP':
      return 'info';
    case 'LOGIC_STEP':
      return 'success';
    case 'BRANCH_NODE':
      return 'warning';
    case 'REVIEW_NODE':
      return 'primary';
    case 'END_NODE':
      return 'danger';
    default:
      return 'neutral';
  }
}

function nodeBadge(type: WorkflowNodeType): { label: string; tone?: FlowNodeTypeDefinition['tone'] } | null {
  switch (type) {
    case 'AI_AGENT_STEP':
      return { label: 'AI', tone: 'info' };
    case 'LOGIC_STEP':
      return { label: 'LOGIC', tone: 'success' };
    case 'BRANCH_NODE':
      return { label: 'IF', tone: 'warning' };
    case 'REVIEW_NODE':
      return { label: 'REVIEW', tone: 'primary' };
    case 'END_NODE':
      return { label: 'END', tone: 'danger' };
    default:
      return null;
  }
}

function isWorkflowNodeType(type: string): type is WorkflowNodeType {
  return WORKFLOW_NODE_TYPES.has(type as WorkflowNodeType);
}

function stringData(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}
