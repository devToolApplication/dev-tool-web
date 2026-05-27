export type ModelProviderType = 'EXTERNAL' | 'LOCAL';
export type ModelProviderCode = 'OPENROUTER' | 'OPUSMAX' | 'LOCAL' | 'OTHER';
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
}

export interface AiAgentModelConfigRequest {
  name: string;
  providerType: ModelProviderType;
  providerCode: ModelProviderCode;
  modelName: string;
  secretReferenceId?: string;
  description?: string;
  status: AiAgentFeatureStatus;
}
