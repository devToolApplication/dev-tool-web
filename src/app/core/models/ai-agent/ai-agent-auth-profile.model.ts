import { AiAgentFeatureStatus, AuthMethod, ModelProviderCode } from './ai-agent-model.model';

export type ScopeType = 'GLOBAL' | 'CHANNEL' | 'AGENT' | 'MODEL' | 'TOOL' | 'USER';

export interface AiAgentAuthProfileResponse {
  id: string;
  name: string;
  code: string;
  providerCode: ModelProviderCode;
  authMethod: AuthMethod;
  tokenEndpoint?: string;
  tokenExpiry?: number;
  secretReferenceId?: string;
  secretReferenceName?: string;
  sessionConfig?: Record<string, any>;
  scopeType?: ScopeType;
  status: AiAgentFeatureStatus;
  lastValidatedAt?: number;
  description?: string;
}

export interface AiAgentAuthProfileRequest {
  name: string;
  code: string;
  providerCode: ModelProviderCode;
  authMethod: AuthMethod;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
  tokenEndpoint?: string;
  secretReferenceId?: string;
  sessionConfig?: Record<string, any>;
  scopeType?: ScopeType;
  status: AiAgentFeatureStatus;
  description?: string;
}

export interface AiAgentAuthProfileLoginRequest {
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
  secretReferenceId?: string;
  sessionConfig?: Record<string, any>;
}
