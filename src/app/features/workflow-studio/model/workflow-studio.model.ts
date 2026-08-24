export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type WorkflowEngineType = 'LEGACY' | 'FLOWABLE';
export type LegacyWorkflowNodeType = 'START' | 'CODE_GATE' | 'AI_GATE' | 'LOGIC' | 'END';
export type BpmnWorkflowNodeType =
  | 'START_EVENT'
  | 'END_EVENT'
  | 'AI_TASK'
  | 'MCP_TASK'
  | 'CODE_TASK'
  | 'HTTP_TASK'
  | 'EXCLUSIVE_GATEWAY'
  | 'PARALLEL_GATEWAY';
export type WorkflowNodeType = LegacyWorkflowNodeType | BpmnWorkflowNodeType;
export type WorkflowEditorMode = 'design' | 'runtime' | 'readonly';
export type WorkflowDefinitionStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type WorkflowVersionStatus = 'DRAFT' | 'PUBLISHED';
export type WorkflowRunStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'WAITING_EXTERNAL'
  | 'COMPLETED'
  | 'ERROR'
  | 'TIMED_OUT'
  | 'CANCELLED';
export type WorkflowNodeExecutionStatus =
  | 'PENDING'
  | 'READY'
  | 'RUNNING'
  | 'WAITING_EXTERNAL'
  | 'COMPLETED'
  | 'ERROR'
  | 'TIMED_OUT'
  | 'CANCELLED'
  | 'SKIPPED';
export type GateOutcome = 'PASS' | 'FAIL' | 'BLOCKED';
export type LogicOperator = 'AND' | 'OR' | 'NOT' | 'N_OF_M' | 'SWITCH';
export type WorkflowValidationSeverity = 'error' | 'warning';
export type WorkflowCompareOperator =
  | 'EQ'
  | 'NE'
  | 'GT'
  | 'GTE'
  | 'LT'
  | 'LTE'
  | 'IN'
  | 'NOT_IN'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'IS_NULL'
  | 'IS_NOT_NULL'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'MATCHES';
export type WorkflowLogicalOperator = 'AND' | 'OR';

export interface WorkflowValue {
  path?: string | null;
  literal?: JsonValue;
}

export interface WorkflowCompareCondition {
  type: 'COMPARE';
  left: WorkflowValue;
  operator: WorkflowCompareOperator;
  right: WorkflowValue;
}

export interface WorkflowCompositeCondition {
  type: 'COMPOSITE';
  operator: WorkflowLogicalOperator;
  conditions: WorkflowCondition[];
}

export type WorkflowCondition = WorkflowCompareCondition | WorkflowCompositeCondition;

export interface WorkflowValidationIssue {
  code: string;
  severity: WorkflowValidationSeverity;
  message: string;
  nodeId?: string;
  edgeId?: string;
  field?: string;
}

export interface WorkflowRuntimeVisualState {
  nodes?: Record<string, WorkflowNodeExecutionStatus>;
  edges?: Record<string, WorkflowNodeExecutionStatus>;
}

export interface RetryPolicy {
  maxAttempts: number;
}

export interface TimeoutPolicy {
  timeoutSeconds: number;
}

export interface InputMapping {
  mapping: JsonValue;
}

export interface StartWorkflowNode {
  id: string;
  type: 'START';
}

export interface EndWorkflowNode {
  id: string;
  type: 'END';
}

export interface CodeGateWorkflowNode {
  id: string;
  type: 'CODE_GATE';
  handler: string;
  config: JsonValue;
  inputMapping: InputMapping;
  retryPolicy: RetryPolicy;
  timeoutPolicy: TimeoutPolicy;
}

export interface AiGateWorkflowNode {
  id: string;
  type: 'AI_GATE';
  instruction: string;
  criteria: JsonValue;
  inputMapping: InputMapping;
  provider: string;
  agentCode: string;
  workingDirectory: string;
  outputSchema: string;
  retryPolicy: RetryPolicy;
  timeoutPolicy: TimeoutPolicy;
}

export interface WorkflowAgentProviderOption {
  provider: string;
  available: boolean;
  health?: string;
}

export interface WorkflowAgentCatalogItem {
  agentCode: string;
  displayName: string;
  defaultProvider?: string;
  supportedProviders: WorkflowAgentProviderOption[];
  requiredDependencies: string[];
  health?: string;
}

export interface WorkflowOutputSchemaCatalogItem {
  value: string;
  label: string;
  description?: string;
  isDefault: boolean;
}

export interface LogicWorkflowNode {
  id: string;
  type: 'LOGIC';
  operator: LogicOperator;
  config: JsonValue;
}

export interface BpmnWorkflowNode {
  id: string;
  type: BpmnWorkflowNodeType;
  name?: string | null;
  config?: JsonValue;
  inputMapping?: JsonValue;
  outputMapping?: JsonValue;
  retryPolicy?: JsonValue;
  timeoutPolicy?: JsonValue;
}

export type WorkflowNode =
  | StartWorkflowNode
  | CodeGateWorkflowNode
  | AiGateWorkflowNode
  | LogicWorkflowNode
  | EndWorkflowNode
  | BpmnWorkflowNode;

export interface WorkflowEdge {
  id?: string | null;
  source: string;
  target: string;
  name?: string | null;
  condition?: WorkflowCondition | null;
  defaultFlow?: boolean;
}

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowRuntimeConfig {
  maxParallel: number | null;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string | null;
  status: WorkflowDefinitionStatus;
  currentDraftVersionId: string | null;
  currentPublishedVersionId: string | null;
}

export interface ExecutableWorkflowPlan {
  nodes: Record<string, JsonValue>;
  dependencies: Record<string, string[]>;
  dependents: Record<string, string[]>;
  entryNodes: string[];
  terminalNodes: string[];
}

export interface WorkflowNodePosition {
  x: number;
  y: number;
}

export interface WorkflowEditorViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface WorkflowEditorMetadata {
  viewport?: WorkflowEditorViewport;
  nodes?: Record<string, WorkflowNodePosition>;
}

export interface WorkflowVersion {
  id: string;
  workflowDefinitionId: string;
  version: number;
  status: WorkflowVersionStatus;
  definition: WorkflowGraph;
  runtime: WorkflowRuntimeConfig | null;
  compiledPlan: ExecutableWorkflowPlan | null;
  engineType?: WorkflowEngineType;
  engineDeploymentId?: string | null;
  engineDefinitionId?: string | null;
  engineDefinitionKey?: string | null;
  compiledBpmnXml?: string | null;
  editor?: WorkflowEditorMetadata;
}

export interface WorkflowDetail {
  definition: WorkflowDefinition;
  versions: WorkflowVersion[];
}

export interface WorkflowNodeExecution {
  nodeId: string;
  nodeType: WorkflowNodeType;
  executionStatus: WorkflowNodeExecutionStatus;
  outcome: GateOutcome | null;
  attempt: number | null;
  inputSnapshot: JsonValue;
  output: JsonValue;
  evidence: JsonValue;
  reason: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

export interface WorkflowRun {
  id: string;
  workflowDefinitionId: string;
  workflowVersionId: string;
  status: WorkflowRunStatus;
  input: JsonValue;
  startedAt: string | null;
  completedAt: string | null;
  finalOutcome: GateOutcome | null;
  finalOutput: JsonValue;
  engineType?: WorkflowEngineType;
  engineInstanceId?: string | null;
  nodes: WorkflowNodeExecution[];
}

export interface WorkflowUpsertPayload {
  name: string;
  description: string | null;
  definition: WorkflowGraph;
  runtime: WorkflowRuntimeConfig | null;
  editor?: WorkflowEditorMetadata | null;
}

export interface WorkflowBackendValidationResult {
  valid: boolean;
  issues: WorkflowValidationIssue[];
}

export interface WorkflowPageQuery {
  page?: number;
  size?: number;
  sort?: string[];
  workflowId?: string;
  status?: WorkflowRunStatus;
}
