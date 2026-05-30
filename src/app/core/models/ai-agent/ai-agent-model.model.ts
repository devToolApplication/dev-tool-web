export type ModelProviderType = 'EXTERNAL' | 'LOCAL' | 'API' | 'AGENT_CLI';
export type ModelProviderCode = 'OPENROUTER' | 'OPUSMAX' | 'OPENAI' | 'ANTHROPIC' | 'GOOGLE' | 'CODEX' | 'CLAUDE' | 'ANTIGRAVITY' | 'LOCAL' | 'OTHER';
export type AuthMethod = 'API_KEY' | 'OAUTH_TOKEN' | 'SESSION_CREDENTIALS';
export type AiAgentFeatureStatus = 'ENABLED' | 'DISABLED';

export interface AiAgentModelConfigResponse {
  id: string;
  name: string;
  providerType: ModelProviderType;
  providerCode: ModelProviderCode;
  modelName: string;
  secretReferenceId?: string;
  secretReferenceName?: string;
  description?: string;
  status: AiAgentFeatureStatus;
  authMethod?: AuthMethod;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  capabilities?: string[];
}

export interface AiAgentModelConfigRequest {
  name: string;
  providerType: ModelProviderType;
  providerCode: ModelProviderCode;
  modelName: string;
  secretReferenceId?: string;
  description?: string;
  status: AiAgentFeatureStatus;
  authMethod?: AuthMethod;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  capabilities?: string[];
}
