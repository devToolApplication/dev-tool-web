export interface AiAgentAskRequest {
  modelId: string;
  systemPrompt?: string;
  userPrompt: string;
}

export interface AiAgentAskResponse {
  success: boolean;
  answer?: string;
  errorMessage?: string;
  totalToken?: number;
}
