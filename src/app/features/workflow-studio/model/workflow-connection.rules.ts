import {
  WorkflowEdge,
  WorkflowGraph,
  WorkflowNode,
  WorkflowValidationSeverity,
} from './workflow-studio.model';
import { workflowEdgeId } from './workflow-graph.utils';

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowConnectionValidationIssue {
  code: string;
  message: string;
  severity: WorkflowValidationSeverity;
  nodeId?: string;
  edgeId?: string;
}

export interface WorkflowConnectionValidationOptions {
  existingEdgeId?: string;
}

export function workflowConnectionFromEdge(edge: WorkflowEdge): WorkflowConnection {
  return {
    id: workflowEdgeId(edge),
    source: edge.source,
    target: edge.target,
  };
}

export function validateWorkflowConnection(
  graph: WorkflowGraph,
  edge: WorkflowEdge,
  options: WorkflowConnectionValidationOptions = {},
): WorkflowConnectionValidationIssue[] {
  const source = findNode(graph, edge.source);
  if (!source) {
    return [issue('SOURCE_NODE_NOT_FOUND', 'Source node was not found', edge.source)];
  }

  const target = findNode(graph, edge.target);
  if (!target) {
    return [issue('TARGET_NODE_NOT_FOUND', 'Target node was not found', edge.target)];
  }

  if (source.id === target.id) {
    return [issue('SELF_CONNECTION_NOT_ALLOWED', 'A node cannot connect to itself', source.id)];
  }

  if (source.type === 'END') {
    return [issue('END_OUTGOING_NOT_ALLOWED', 'END nodes cannot have outgoing connections', source.id)];
  }

  if (target.type === 'START') {
    return [issue('START_INCOMING_NOT_ALLOWED', 'START nodes cannot have incoming connections', target.id)];
  }

  if (hasDuplicateEdge(graph, edge, options.existingEdgeId)) {
    return [{
      code: 'DUPLICATE_CONNECTION',
      message: 'This connection already exists',
      severity: 'error',
      edgeId: workflowEdgeId(edge),
    }];
  }

  return [];
}

function findNode(graph: WorkflowGraph, nodeId: string): WorkflowNode | undefined {
  return graph.nodes.find((node) => node.id === nodeId);
}

function hasDuplicateEdge(
  graph: WorkflowGraph,
  edge: WorkflowEdge,
  existingEdgeId?: string,
): boolean {
  return graph.edges.some((item) => (
    workflowEdgeId(item) !== existingEdgeId && workflowEdgeId(item) === workflowEdgeId(edge)
  ));
}

function issue(
  code: string,
  message: string,
  nodeId: string,
): WorkflowConnectionValidationIssue {
  return {
    code,
    message,
    severity: 'error',
    nodeId,
  };
}
