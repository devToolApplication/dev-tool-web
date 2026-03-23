import { UploadStorageStatus } from '../file-storage/upload-storage.model';

export interface AiAgentConfigResponse {
  id: string;
  category: string;
  key: string;
  value: string;
  description?: string;
  status: UploadStorageStatus;
}

export interface AiAgentConfigCreateDto {
  category: string;
  key: string;
  value: string;
  description?: string;
  status: UploadStorageStatus;
}

export interface AiAgentConfigUpdateDto {
  category?: string;
  key?: string;
  value?: string;
  description?: string;
  status?: UploadStorageStatus;
}
