import { workflowEdgeId } from './workflow-graph.utils';
import {
  AiGateWorkflowNode,
  CodeGateWorkflowNode,
  JsonValue,
  LogicWorkflowNode,
  WorkflowEdge,
  WorkflowGraph,
  WorkflowNode,
  WorkflowValidationIssue,
} from './workflow-studio.model';

export function validateWorkflowGraph(graph: WorkflowGraph): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = [];
  const nodeById = indexNodes(graph.nodes, issues);

  validateStartAndEnd(graph.nodes, issues);
  validateEdges(graph.edges, nodeById, issues);
  validateNodeConfig(graph, nodeById, issues);
  validateReachability(graph, issues);
  validatePathToEnd(graph, issues);

  return issues;
}

function indexNodes(
  nodes: WorkflowNode[],
  issues: WorkflowValidationIssue[],
): Map<string, WorkflowNode> {
  const nodeById = new Map<string, WorkflowNode>();
  for (const node of nodes) {
    if (nodeById.has(node.id)) {
      issues.push(issue('DUPLICATE_NODE_ID', `Duplicate node id: ${node.id}`, { nodeId: node.id }));
      continue;
    }
    nodeById.set(node.id, node);
  }
  return nodeById;
}

function validateStartAndEnd(nodes: WorkflowNode[], issues: WorkflowValidationIssue[]): void {
  const startNodes = nodes.filter((node) => node.type === 'START');
  const endNodes = nodes.filter((node) => node.type === 'END');
  if (startNodes.length !== 1) {
    issues.push(issue('START_REQUIRED', 'Workflow must have exactly one START'));
  }
  if (endNodes.length < 1) {
    issues.push(issue('END_REQUIRED', 'Workflow must have at least one END'));
  }
}

function validateEdges(
  edges: WorkflowEdge[],
  nodeById: Map<string, WorkflowNode>,
  issues: WorkflowValidationIssue[],
): void {
  const seen = new Set<string>();
  for (const edge of edges) {
    const edgeId = workflowEdgeId(edge);
    if (seen.has(edgeId)) {
      issues.push(issue('DUPLICATE_CONNECTION', 'This connection already exists', { edgeId }));
    }
    seen.add(edgeId);

    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source) {
      issues.push(issue('EDGE_SOURCE_NOT_FOUND', `Edge source not found: ${edge.source}`, { edgeId }));
    }
    if (!target) {
      issues.push(issue('EDGE_TARGET_NOT_FOUND', `Edge target not found: ${edge.target}`, { edgeId }));
    }
    if (!source || !target) {
      continue;
    }
    if (source.id === target.id) {
      issues.push(issue('SELF_CONNECTION_NOT_ALLOWED', 'A node cannot connect to itself', { nodeId: source.id, edgeId }));
    }
    if (source.type === 'END') {
      issues.push(issue('END_OUTGOING_NOT_ALLOWED', 'END nodes cannot have outgoing connections', { nodeId: source.id, edgeId }));
    }
    if (target.type === 'START') {
      issues.push(issue('START_INCOMING_NOT_ALLOWED', 'START nodes cannot have incoming connections', { nodeId: target.id, edgeId }));
    }
  }
}

function validateNodeConfig(
  graph: WorkflowGraph,
  nodeById: Map<string, WorkflowNode>,
  issues: WorkflowValidationIssue[],
): void {
  const incoming = incomingCounts(graph.edges);
  for (const node of graph.nodes) {
    if (node.type === 'AI_GATE') {
      validateAiGate(node, issues);
    } else if (node.type === 'CODE_GATE') {
      validateCodeGate(node, issues);
    } else if (node.type === 'LOGIC') {
      validateLogic(node, incoming.get(node.id) ?? 0, graph.edges, nodeById, issues);
    }
  }
}

function validateAiGate(node: AiGateWorkflowNode, issues: WorkflowValidationIssue[]): void {
  requiredText(node.instruction, 'AI_GATE_INSTRUCTION_REQUIRED', 'AI_GATE instruction is required', node.id, 'instruction', issues);
  requiredText(node.outputSchema, 'AI_GATE_OUTPUT_SCHEMA_REQUIRED', 'AI_GATE output schema is required', node.id, 'outputSchema', issues);
  requiredText(node.agentCode, 'AI_GATE_AGENT_CODE_REQUIRED', 'AI_GATE agent code is required', node.id, 'agentCode', issues);
  requiredText(node.workingDirectory, 'AI_GATE_WORKING_DIRECTORY_REQUIRED', 'AI_GATE working directory is required', node.id, 'workingDirectory', issues);
}

function validateCodeGate(node: CodeGateWorkflowNode, issues: WorkflowValidationIssue[]): void {
  requiredText(node.handler, 'CODE_GATE_HANDLER_REQUIRED', 'CODE_GATE handler is required', node.id, 'handler', issues);
}

function validateLogic(
  node: LogicWorkflowNode,
  incoming: number,
  edges: WorkflowEdge[],
  nodeById: Map<string, WorkflowNode>,
  issues: WorkflowValidationIssue[],
): void {
  if ((node.operator === 'AND' || node.operator === 'OR') && incoming < 2) {
    issues.push(issue('LOGIC_INCOMING_REQUIRED', `${node.operator} requires at least 2 incoming dependencies`, { nodeId: node.id }));
  }
  if (node.operator === 'NOT' && incoming !== 1) {
    issues.push(issue('LOGIC_INCOMING_REQUIRED', 'NOT requires exactly 1 incoming dependency', { nodeId: node.id }));
  }
  if (node.operator === 'N_OF_M') {
    validateNOfM(node, incoming, issues);
  }
  if (node.operator === 'SWITCH') {
    validateSwitch(node, edges, nodeById, issues);
  }
}

function validateNOfM(node: LogicWorkflowNode, incoming: number, issues: WorkflowValidationIssue[]): void {
  const config = asRecord(node.config);
  const required = config ? config['required'] : undefined;
  if (!Number.isInteger(required)) {
    issues.push(issue('N_OF_M_REQUIRED_INVALID', 'N_OF_M required count is required', { nodeId: node.id, field: 'config.required' }));
    return;
  }
  if ((required as number) < 1 || (required as number) > incoming) {
    issues.push(issue('N_OF_M_REQUIRED_OUT_OF_RANGE', 'N_OF_M required count must fit incoming dependencies', { nodeId: node.id, field: 'config.required' }));
  }
}

function validateSwitch(
  node: LogicWorkflowNode,
  edges: WorkflowEdge[],
  nodeById: Map<string, WorkflowNode>,
  issues: WorkflowValidationIssue[],
): void {
  const config = asRecord(node.config);
  const cases = asRecord(config?.['cases']);
  if (cases) {
    Object.entries(cases).forEach(([outcome, target]) => {
      if (typeof target === 'string') {
        validateSwitchTarget(node, target, `config.cases.${outcome}`, edges, nodeById, issues);
      }
    });
  }
  const defaultTarget = config?.['default'];
  if (typeof defaultTarget === 'string') {
    validateSwitchTarget(node, defaultTarget, 'config.default', edges, nodeById, issues);
  }
}

function validateSwitchTarget(
  node: LogicWorkflowNode,
  target: string,
  field: string,
  edges: WorkflowEdge[],
  nodeById: Map<string, WorkflowNode>,
  issues: WorkflowValidationIssue[],
): void {
  if (!nodeById.has(target)) {
    issues.push(issue('SWITCH_TARGET_NOT_FOUND', `SWITCH target not found: ${target}`, { nodeId: node.id, field }));
    return;
  }
  if (!edges.some((edge) => edge.source === node.id && edge.target === target)) {
    issues.push(issue('SWITCH_BRANCH_EDGE_MISSING', `SWITCH target has no outgoing edge: ${target}`, { nodeId: node.id, field }));
  }
}

function validateReachability(graph: WorkflowGraph, issues: WorkflowValidationIssue[]): void {
  const start = graph.nodes.find((node) => node.type === 'START');
  if (!start) {
    return;
  }
  const reachable = traverse(start.id, outgoing(graph.edges));
  graph.nodes
    .filter((node) => !reachable.has(node.id))
    .forEach((node) => issues.push(issue('NODE_NOT_REACHABLE_FROM_START', `Node is not reachable from START: ${node.id}`, { nodeId: node.id })));
}

function validatePathToEnd(graph: WorkflowGraph, issues: WorkflowValidationIssue[]): void {
  const endIds = graph.nodes.filter((node) => node.type === 'END').map((node) => node.id);
  if (!endIds.length) {
    return;
  }
  const reverse = outgoing(graph.edges.map((edge) => ({ source: edge.target, target: edge.source })));
  const canReachEnd = new Set<string>();
  endIds.forEach((endId) => traverse(endId, reverse).forEach((nodeId) => canReachEnd.add(nodeId)));
  graph.nodes
    .filter((node) => !canReachEnd.has(node.id))
    .forEach((node) => issues.push(issue('NODE_CANNOT_REACH_END', `Node cannot reach END: ${node.id}`, { nodeId: node.id })));
}

function incomingCounts(edges: WorkflowEdge[]): Map<string, number> {
  const counts = new Map<string, number>();
  edges.forEach((edge) => counts.set(edge.target, (counts.get(edge.target) ?? 0) + 1));
  return counts;
}

function outgoing(edges: WorkflowEdge[]): Map<string, string[]> {
  const next = new Map<string, string[]>();
  edges.forEach((edge) => {
    next.set(edge.source, [...(next.get(edge.source) ?? []), edge.target]);
  });
  return next;
}

function traverse(startNodeId: string, outgoingEdges: Map<string, string[]>): Set<string> {
  const visited = new Set<string>();
  const queue = [startNodeId];
  while (queue.length) {
    const nodeId = queue.shift()!;
    if (visited.has(nodeId)) {
      continue;
    }
    visited.add(nodeId);
    queue.push(...(outgoingEdges.get(nodeId) ?? []));
  }
  return visited;
}

function requiredText(
  value: string | undefined | null,
  code: string,
  message: string,
  nodeId: string,
  field: string,
  issues: WorkflowValidationIssue[],
): void {
  if (typeof value !== 'string' || !value.trim()) {
    issues.push(issue(code, message, { nodeId, field }));
  }
}

function issue(
  code: string,
  message: string,
  ref: Partial<WorkflowValidationIssue> = {},
): WorkflowValidationIssue {
  return {
    code,
    message,
    severity: 'error',
    ...ref,
  };
}

function asRecord(value: JsonValue | undefined): Record<string, JsonValue> | null {
  return !!value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}
