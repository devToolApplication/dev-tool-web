import { UploadStorageStatus } from '../file-storage/upload-storage.model';

export type AiProviderModelType = 'GROQ' | 'OPENROUTER' | 'PLAYWRIGHT';
export type AiModelMetadataType = 'RAW_TEXT' | 'KEYCLOAK_AUTH' | 'BASIC_AUTH' | 'CONFIG' | 'SECRET';
export type AiModelKeycloakGrantType = 'CLIENT_CREDENTIALS' | 'PASSWORD';
export type AiApiType = 'OPENAI_COMPATIBLE' | 'TEXT_ONLY' | 'CUSTOM';
export type ToolSupportMode = 'NATIVE' | 'NONE';

export interface AiModelMetadataConfig {
  tokenUrl?: string;
  clientId?: string;
  clientSecretId?: string;
  grantType?: AiModelKeycloakGrantType;
  username?: string;
  passwordSecretId?: string;
  scope?: string;
}

export interface AiModelMetadataEntry {
  key: string;
  type: AiModelMetadataType;
  value?: string;
  config?: AiModelMetadataConfig;
}

export interface AiModelResponse {
  id: string;
  code?: string;
  modelName: string;
  description?: string;
  modelType: string;
  providerModelType: AiProviderModelType;
  status: UploadStorageStatus;
  defaultActive: boolean;
  url?: string;
  apiType?: AiApiType;
  toolSupportMode?: ToolSupportMode;
  timeoutMs?: number;
  maxContext?: number;
  metadata: AiModelMetadataEntry[];
}

export interface AiModelCreateDto {
  code?: string;
  modelName: string;
  description?: string;
  modelType: string;
  providerModelType: AiProviderModelType;
  status: UploadStorageStatus;
  defaultActive: boolean;
  url?: string;
  apiType?: AiApiType;
  toolSupportMode?: ToolSupportMode;
  timeoutMs?: number;
  maxContext?: number;
  metadata: AiModelMetadataEntry[];
}

export interface AiModelUpdateDto {
  code?: string;
  modelName?: string;
  description?: string;
  modelType?: string;
  providerModelType?: AiProviderModelType;
  status?: UploadStorageStatus;
  defaultActive?: boolean;
  url?: string;
  apiType?: AiApiType;
  toolSupportMode?: ToolSupportMode;
  timeoutMs?: number;
  maxContext?: number;
  metadata?: AiModelMetadataEntry[];
}
