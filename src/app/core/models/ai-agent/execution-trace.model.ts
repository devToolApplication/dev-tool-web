export type ExecutionSessionStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'MAX_STEP_EXCEEDED';
export type ExecutionStepType = 'USER_INPUT' | 'MODEL_REQUEST' | 'MODEL_RESPONSE' | 'TOOL_CALL' | 'TOOL_RESULT' | 'FINAL_ANSWER' | 'ERROR';

export interface ExecutionSessionResponse {
  id: string;
  sessionId: string;
  channel?: string;
  userId?: string;
  agentId?: string;
  modelId?: string;
  inputText?: string;
  status: ExecutionSessionStatus;
  errorMessage?: string;
  totalTokens?: number;
  iterationCount?: number;
  startedAt?: string;
  finishedAt?: string;
}

export interface ExecutionStepResponse {
  id: string;
  sessionId: string;
  stepNo: number;
  stepType: ExecutionStepType;
  payloadJson?: string;
  createdAt?: string;
}
