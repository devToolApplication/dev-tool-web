import type {
  GateOutcome,
  BpmnWorkflowNodeType,
  JsonValue,
  WorkflowCondition,
  LogicOperator,
  WorkflowDefinitionStatus,
  WorkflowNodeExecutionStatus,
  WorkflowNodeType,
  WorkflowRunStatus,
  WorkflowVersionStatus,
  WorkflowValidationSeverity,
} from './workflow-studio.model';

export interface RetryPolicyDto {
  maxAttempts: number;
}

export interface TimeoutPolicyDto {
  timeoutSeconds: number;
}

export interface InputMappingDto {
  mapping: JsonValue;
}

export interface StartWorkflowNodeDto {
  id: string;
  type: 'START';
}

export interface EndWorkflowNodeDto {
  id: string;
  type: 'END';
}

export interface CodeGateWorkflowNodeDto {
  id: string;
  type: 'CODE_GATE';
  handler: string;
  config: JsonValue;
  inputMapping: InputMappingDto;
  retryPolicy: RetryPolicyDto;
  timeoutPolicy: TimeoutPolicyDto;
}

export interface AiGateWorkflowNodeDto {
  id: string;
  type: 'AI_GATE';
  instruction: string;
  criteria: JsonValue;
  inputMapping: InputMappingDto;
  provider: string;
  agentCode: string;
  workingDirectory: string;
  outputSchema: string;
  retryPolicy: RetryPolicyDto;
  timeoutPolicy: TimeoutPolicyDto;
}

export interface LogicWorkflowNodeDto {
  id: string;
  type: 'LOGIC';
  operator: LogicOperator;
  config: JsonValue;
}

export interface BpmnWorkflowNodeDto {
  id: string;
  type: BpmnWorkflowNodeType;
  name?: string | null;
  config?: JsonValue;
  inputMapping?: JsonValue;
  outputMapping?: JsonValue;
  retryPolicy?: JsonValue;
  timeoutPolicy?: JsonValue;
}

export type WorkflowNodeDto =
  | StartWorkflowNodeDto
  | CodeGateWorkflowNodeDto
  | AiGateWorkflowNodeDto
  | LogicWorkflowNodeDto
  | EndWorkflowNodeDto
  | BpmnWorkflowNodeDto;

export interface WorkflowEdgeDto {
  id?: string | null;
  source: string;
  target: string;
  name?: string | null;
  condition?: WorkflowCondition | null;
  defaultFlow?: boolean;
}

export interface WorkflowGraphDto {
  nodes: WorkflowNodeDto[];
  edges: WorkflowEdgeDto[];
}

export interface WorkflowRuntimeConfigDto {
  maxParallel: number | null;
}

export interface WorkflowDefinitionDto {
  id: string;
  name: string;
  description: string | null;
  status: WorkflowDefinitionStatus;
  currentDraftVersionId: string | null;
  currentPublishedVersionId: string | null;
}

export interface WorkflowEditorMetadataDto {
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  nodes?: Record<string, { x: number; y: number }>;
}

export interface WorkflowVersionDto {
  id: string;
  workflowDefinitionId: string;
  version: number;
  status: WorkflowVersionStatus;
  bpmnXml: string;
  runtime: WorkflowRuntimeConfigDto | null;
  engineDeploymentId?: string | null;
  engineDefinitionId?: string | null;
  engineDefinitionKey?: string | null;
}

export interface WorkflowDetailDto {
  definition: WorkflowDefinitionDto;
  versions: WorkflowVersionDto[];
}

export interface WorkflowNodeExecutionDto {
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

export interface WorkflowRunDto {
  id: string;
  workflowDefinitionId: string;
  workflowVersionId: string;
  status: WorkflowRunStatus;
  input: JsonValue;
  startedAt: string | null;
  completedAt: string | null;
  finalOutcome: GateOutcome | null;
  finalOutput: JsonValue;
  engineInstanceId?: string | null;
  nodes: WorkflowNodeExecutionDto[];
}

export interface WorkflowStartDto {
  input: JsonValue;
}

export interface WorkflowUpsertDto {
  name: string;
  description: string | null;
  bpmnXml: string;
  runtime: WorkflowRuntimeConfigDto | null;
}

export interface WorkflowValidationIssueDto {
  code?: string | null;
  severity: Uppercase<WorkflowValidationSeverity>;
  message: string;
  elementId?: string | null;
  nodeId?: string | null;
  edgeId?: string | null;
  field?: string | null;
}

export interface WorkflowValidationResponseDto {
  valid: boolean;
  issues: WorkflowValidationIssueDto[];
}
