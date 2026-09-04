import { WorkflowEdge, WorkflowNodeExecution, WorkflowRuntimeVisualState } from "./workflow-studio.model";

export function workflowEdgeId(edge: WorkflowEdge): string {
  return edge.id || (edge.source + "__" + edge.target);
}

/**
 * Calculates visual states for nodes and traversed sequence flow edges in runtime mode.
 * Traversed edges are marked as COMPLETED (green) if source and target are completed,
 * or RUNNING (blue/active) if flowing into a running node.
 */
export function computeWorkflowRuntimeVisualState(
  executions: WorkflowNodeExecution[] = [],
  edges: WorkflowEdge[] = []
): WorkflowRuntimeVisualState {
  const nodeStatusMap: Record<string, any> = {};
  const edgeStatusMap: Record<string, any> = {};

  executions.forEach((exec) => {
    nodeStatusMap[exec.nodeId] = exec.executionStatus;
  });

  for (let i = 0; i < executions.length - 1; i++) {
    const current = executions[i];
    const next = executions[i + 1];
    const matchingEdge = edges.find(
      (edge) => edge.source === current.nodeId && edge.target === next.nodeId
    );

    if (matchingEdge) {
      const edgeId = matchingEdge.id || workflowEdgeId(matchingEdge);
      if (current.executionStatus === "COMPLETED" && next.executionStatus === "COMPLETED") {
        edgeStatusMap[edgeId] = "COMPLETED";
      } else {
        edgeStatusMap[edgeId] = next.executionStatus || "RUNNING";
      }
    }
  }

  return { nodes: nodeStatusMap, edges: edgeStatusMap };
}

