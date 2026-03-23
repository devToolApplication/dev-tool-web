import { UploadStorageStatus } from '../file-storage/upload-storage.model';

export interface AiAgentSecretResponse {
  id: string;
  category: string;
  name: string;
  code: string;
  secretValue: string;
  description?: string;
  status: UploadStorageStatus;
}

export interface AiAgentSecretCreateDto {
  category: string;
  name: string;
  code: string;
  secretValue: string;
  description?: string;
  status: UploadStorageStatus;
}

export interface AiAgentSecretUpdateDto {
  category?: string;
  name?: string;
  code?: string;
  secretValue?: string;
  description?: string;
  status?: UploadStorageStatus;
}
