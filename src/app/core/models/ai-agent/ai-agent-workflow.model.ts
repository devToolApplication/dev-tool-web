// Workflow Definition
export type WorkflowDefinitionStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type WorkflowVersionStatus = 'DRAFT' | 'PUBLISHED';
export type WorkflowNodeType = 'AI_AGENT_STEP' | 'LOGIC_STEP' | 'BRANCH_NODE' | 'REVIEW_NODE' | 'END_NODE';

export interface AiAgentWorkflowDefinitionResponse {
  id: string;
  name: string;
  description?: string;
  status: WorkflowDefinitionStatus;
  currentDraftVersionId?: string;
  currentPublishedVersionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AiAgentWorkflowDefinitionRequest {
  name: string;
  description?: string;
}

export interface AiAgentWorkflowGraphDraftRequest {
  nodesJson: string;
  edgesJson: string;
}

export interface AiAgentWorkflowValidationResponse {
  valid: boolean;
  errors: string[];
}

export interface AiAgentWorkflowPublishResponse {
  workflowDefinitionId: string;
  workflowVersionId: string;
  versionNumber: number;
}

export interface AiAgentWorkflowGraphDraftResponse {
  workflowDefinitionId: string;
  versionId: string;
  versionNumber: number;
  nodesJson: string;
  edgesJson: string;
}

// Graph Node & Edge models (used in canvas)
export interface WorkflowNode {
  id: string;
  name: string;
  type: WorkflowNodeType;
  config?: string; // JSON string of node-specific config
  position?: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string; // SpEL expression for BRANCH_NODE edges
  label?: string;
}

// Node config schemas
export interface AiAgentStepConfig {
  agentConfigId: string;
  promptTemplate?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface LogicStepConfig {
  logicCode: string;
  params?: Record<string, any>;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface ReviewNodeConfig {
  instructions?: string;
  autoApproveTimeoutMinutes?: number;
}

// Node palette item
export interface NodePaletteItem {
  type: WorkflowNodeType;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const NODE_PALETTE: NodePaletteItem[] = [
  { type: 'AI_AGENT_STEP', label: 'AI Agent', icon: 'pi pi-android', color: '#3B82F6', description: 'Call AI model to process task' },
  { type: 'LOGIC_STEP', label: 'Logic Step', icon: 'pi pi-cog', color: '#10B981', description: 'Transform, validate, or integrate data' },
  { type: 'BRANCH_NODE', label: 'Branch', icon: 'pi pi-sitemap', color: '#F59E0B', description: 'Conditional routing based on data' },
  { type: 'REVIEW_NODE', label: 'Review', icon: 'pi pi-eye', color: '#8B5CF6', description: 'Pause for human review' },
  { type: 'END_NODE', label: 'End', icon: 'pi pi-stop-circle', color: '#EF4444', description: 'Terminal node — workflow completes' }
];

export const LOGIC_CODES = [
  { value: 'MAP_OUTPUT', label: 'Map Output' },
  { value: 'VALIDATE_SCHEMA', label: 'Validate Schema' },
  { value: 'MERGE_RESULTS', label: 'Merge Results' },
  { value: 'SAVE_FILE', label: 'Save File' },
  { value: 'SAVE_RESPONSE_DB', label: 'Save to DB' },
  { value: 'CALL_INTERNAL_API', label: 'Call Internal API' },
  { value: 'EXTRACT_FILE', label: 'Extract File' },
  { value: 'CREATE_JIRA_TICKET', label: 'Create Jira Ticket' }
];
