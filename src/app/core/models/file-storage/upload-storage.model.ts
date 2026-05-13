export type UploadStorageType = 'PINATA';

export type UploadStorageStatus = 'ACTIVE' | 'INACTIVE' | 'DELETE';
export type UploadStorageMetadataType = 'RAW_TEXT' | 'KEYCLOAK_AUTH' | 'BASIC_AUTH' | 'CONFIG' | 'SECRET';

export type UploadStorageKeycloakGrantType = 'CLIENT_CREDENTIALS' | 'PASSWORD';

export interface UploadStorageMetadataConfig {
  tokenUrl?: string;
  clientId?: string;
  clientSecretId?: string;
  grantType?: UploadStorageKeycloakGrantType;
  username?: string;
  passwordSecretId?: string;
  scope?: string;
}

export interface UploadStorageMetadataEntry {
  key: string;
  type: UploadStorageMetadataType;
  value?: string;
  config?: UploadStorageMetadataConfig;
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
