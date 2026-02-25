export type UploadStorageType = 'PINATA';

export type UploadStorageStatus = 'ACTIVE' | 'INACTIVE' | 'DELETE';

export interface UploadStorageResponse {
  id: string;
  name: string;
  description?: string;
  storageType: UploadStorageType;
  defaultActive: boolean;
  status: UploadStorageStatus;
  apiDomain?: string;
  apiPath?: string;
  metadata?: Record<string, string>;
}

export interface UploadStorageCreateDto {
  name: string;
  description?: string;
  storageType: UploadStorageType;
  defaultActive: boolean;
  status: UploadStorageStatus;
  apiDomain?: string;
  apiPath?: string;
  metadata?: Record<string, string>;
}

export interface UploadStorageUpdateDto {
  name?: string;
  description?: string;
  defaultActive?: boolean;
  status?: UploadStorageStatus;
  apiDomain?: string;
  apiPath?: string;
  metadata?: Record<string, string>;
}
