import { UploadStorageStatus } from './upload-storage.model';

export interface StorageConfigResponse {
  id: string;
  category: string;
  key: string;
  value: string;
  description?: string;
  status: UploadStorageStatus;
}

export interface StorageConfigCreateDto {
  category: string;
  key: string;
  value: string;
  description?: string;
  status: UploadStorageStatus;
}

export interface StorageConfigUpdateDto {
  category?: string;
  key?: string;
  value?: string;
  description?: string;
  status?: UploadStorageStatus;
}
