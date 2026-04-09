import { UploadStorageStatus } from '../file-storage/upload-storage.model';

export type AiProviderModelType = 'GROQ' | 'OPENROUTER' | 'PLAYWRIGHT';
export type AiModelMetadataType = 'CONFIG' | 'SECRET';

export interface AiModelMetadataEntry {
  key: string;
  type: AiModelMetadataType;
  value: string;
}

export interface AiModelResponse {
  id: string;
  modelName: string;
  description?: string;
  modelType: string;
  providerModelType: AiProviderModelType;
  status: UploadStorageStatus;
  defaultActive: boolean;
  url?: string;
  metadata: AiModelMetadataEntry[];
}

export interface AiModelCreateDto {
  modelName: string;
  description?: string;
  modelType: string;
  providerModelType: AiProviderModelType;
  status: UploadStorageStatus;
  defaultActive: boolean;
  url?: string;
  metadata: AiModelMetadataEntry[];
}

export interface AiModelUpdateDto {
  modelName?: string;
  description?: string;
  modelType?: string;
  providerModelType?: AiProviderModelType;
  status?: UploadStorageStatus;
  defaultActive?: boolean;
  url?: string;
  metadata?: AiModelMetadataEntry[];
}
