export interface AiAgentAskRequest {
  modelId?: string;
  agentId?: string;
  agentCode?: string;
  systemPrompt?: string;
  userPrompt: string;
  userId?: string;
}

export interface AiAgentAskResponse {
  success: boolean;
  answer?: string;
  sessionId?: string;
  executionStatus?: string;
  errorMessage?: string;
  totalToken?: number;
  iterationCount?: number;
  toolExecutions?: {
    callId?: string;
    toolName?: string;
    arguments?: string;
    result?: string;
  }[];
}
