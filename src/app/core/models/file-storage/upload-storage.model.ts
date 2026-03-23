export type UploadStorageType = 'PINATA';

export type UploadStorageStatus = 'ACTIVE' | 'INACTIVE' | 'DELETE';
export type UploadStorageMetadataType = 'CONFIG' | 'SECRET';

export interface UploadStorageMetadataEntry {
  key: string;
  type: UploadStorageMetadataType;
  value: string;
}

export interface UploadStorageResponse {
  id: string;
  name: string;
  description?: string;
  storageType: UploadStorageType;
  defaultActive: boolean;
  status: UploadStorageStatus;
  apiDomain?: string;
  apiPath?: string;
  metadata?: UploadStorageMetadataEntry[];
}

export interface UploadStorageCreateDto {
  name: string;
  description?: string;
  storageType: UploadStorageType;
  defaultActive: boolean;
  status: UploadStorageStatus;
  apiDomain?: string;
  apiPath?: string;
  metadata?: UploadStorageMetadataEntry[];
}

export interface UploadStorageUpdateDto {
  name?: string;
  description?: string;
  defaultActive?: boolean;
  status?: UploadStorageStatus;
  apiDomain?: string;
  apiPath?: string;
  metadata?: UploadStorageMetadataEntry[];
}
