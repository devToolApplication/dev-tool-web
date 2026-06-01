// Workflow Run types
export type WorkflowRunStatus = 'RUNNING' | 'WAITING_REVIEW' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type ExecutionEventType = 'RUN_CREATED' | 'RUN_STARTED' | 'RUN_COMPLETED' | 'RUN_FAILED' | 'RUN_CANCELLED'
  | 'NODE_STARTED' | 'NODE_COMPLETED' | 'NODE_FAILED'
  | 'REVIEW_REQUESTED' | 'REVIEW_DECIDED'
  | 'BRANCH_SELECTED';

export interface AiAgentWorkflowRunResponse {
  id: string;
  workflowDefinitionId: string;
  workflowVersionId: string;
  status: WorkflowRunStatus;
  currentNodeId?: string;
  workflowName?: string;
  inputJson?: string;
  finalResultJson?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

export interface AiAgentWorkflowRunSubmitRequest {
  workflowDefinitionId: string;
  inputJson?: string;
}

export interface AiAgentExecutionEventResponse {
  id: string;
  workflowRunId: string;
  stepRunId?: string;
  nodeId?: string;
  nodeType?: string;
  eventType: ExecutionEventType;
  safeSummary?: string;
  metadataJson?: string;
  createdAt?: string;
}

export interface AiAgentWorkflowResultResponse {
  workflowRunId: string;
  status: WorkflowRunStatus;
  finalResultJson?: string;
  safeErrorCode?: string;
  safeErrorMessage?: string;
}

export interface AiAgentReviewDecisionRequest {
  decision: 'APPROVE' | 'REJECT';
  comment?: string;
  targetNodeId?: string;
}

// Status badge config
export const WORKFLOW_RUN_STATUS_CONFIG: Record<WorkflowRunStatus, { label: string; severity: string; icon: string }> = {
  RUNNING: { label: 'Running', severity: 'info', icon: 'pi pi-spin pi-spinner' },
  WAITING_REVIEW: { label: 'Waiting Review', severity: 'warning', icon: 'pi pi-clock' },
  COMPLETED: { label: 'Completed', severity: 'success', icon: 'pi pi-check-circle' },
  FAILED: { label: 'Failed', severity: 'danger', icon: 'pi pi-times-circle' },
  CANCELLED: { label: 'Cancelled', severity: 'secondary', icon: 'pi pi-ban' }
};
