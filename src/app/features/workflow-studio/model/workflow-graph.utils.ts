import { WorkflowEdge } from './workflow-studio.model';

export function workflowEdgeId(edge: WorkflowEdge): string {
  return edge.id || `${edge.source}__${edge.target}`;
}
