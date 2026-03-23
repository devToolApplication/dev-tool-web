import { UploadStorageStatus } from './upload-storage.model';

export interface StorageSecretResponse {
  id: string;
  category: string;
  name: string;
  code: string;
  secretValue: string;
  description?: string;
  status: UploadStorageStatus;
}

export interface StorageSecretCreateDto {
  category: string;
  name: string;
  code: string;
  secretValue: string;
  description?: string;
  status: UploadStorageStatus;
}

export interface StorageSecretUpdateDto {
  category?: string;
  name?: string;
  code?: string;
  secretValue?: string;
  description?: string;
  status?: UploadStorageStatus;
}
