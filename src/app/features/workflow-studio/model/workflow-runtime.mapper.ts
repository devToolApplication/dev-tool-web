import { workflowEdgeId } from './workflow-graph.utils';
import {
  WorkflowDetail,
  WorkflowGraph,
  WorkflowNodeExecutionStatus,
  WorkflowRuntimeVisualState,
  WorkflowRun,
  WorkflowRunStatus,
  WorkflowVersion,
} from './workflow-studio.model';

export function workflowRunToRuntimeVisualState(
  run: WorkflowRun | null | undefined,
  graph?: WorkflowGraph | null | undefined,
): WorkflowRuntimeVisualState {
  const nodes = Object.fromEntries(
    (run?.nodes ?? []).map((execution) => [execution.nodeId, execution.executionStatus]),
  ) as Record<string, WorkflowNodeExecutionStatus>;

  return {
    nodes,
    edges: Object.fromEntries(
      (graph?.edges ?? [])
        .map((edge) => [workflowEdgeId(edge), edgeRuntimeStatus(edge.source, edge.target, nodes)])
        .filter((entry): entry is [string, WorkflowNodeExecutionStatus] => !!entry[1]),
    ),
  };
}

export function workflowRunIsActive(status: WorkflowRunStatus | null | undefined): boolean {
  return status === 'PENDING' || status === 'RUNNING' || status === 'WAITING_EXTERNAL';
}

export function workflowRunIsTerminal(status: WorkflowRunStatus | null | undefined): boolean {
  return status === 'COMPLETED'
    || status === 'ERROR'
    || status === 'TIMED_OUT'
    || status === 'CANCELLED';
}

export function workflowRunVersionForDetail(
  detail: WorkflowDetail | null | undefined,
  workflowVersionId: string | null | undefined,
): WorkflowVersion | null {
  if (!detail) {
    return null;
  }

  return detail.versions.find((version) => version.id === workflowVersionId)
    ?? detail.versions.find((version) => version.id === detail.definition.currentPublishedVersionId)
    ?? detail.versions.find((version) => version.status === 'PUBLISHED')
    ?? detail.versions[0]
    ?? null;
}

function edgeRuntimeStatus(
  source: string,
  target: string,
  nodes: Record<string, WorkflowNodeExecutionStatus>,
): WorkflowNodeExecutionStatus | undefined {
  const sourceStatus = nodes[source];
  const targetStatus = nodes[target];

  return dangerStatus(sourceStatus)
    ?? dangerStatus(targetStatus)
    ?? targetStatus
    ?? sourceStatus;
}

function dangerStatus(status: WorkflowNodeExecutionStatus | undefined): WorkflowNodeExecutionStatus | undefined {
  return status === 'ERROR' || status === 'TIMED_OUT' || status === 'CANCELLED'
    ? status
    : undefined;
}
