import { UploadStorageStatus } from '../file-storage/upload-storage.model';

export type AiProviderModelType = 'GROQ' | 'OPENROUTER' | 'PLAYWRIGHT';
export type AiModelMetadataType = 'CONFIG' | 'SECRET';
export type AiApiType = 'OPENAI_COMPATIBLE' | 'TEXT_ONLY' | 'CUSTOM';
export type ToolSupportMode = 'NATIVE' | 'NONE';

export interface AiModelMetadataEntry {
  key: string;
  type: AiModelMetadataType;
  value: string;
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
