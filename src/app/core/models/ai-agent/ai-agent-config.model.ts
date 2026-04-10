import { UploadStorageStatus } from '../file-storage/upload-storage.model';

export type ConfigValueType = 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON' | 'DECIMAL';
export type ScopeType = 'GLOBAL' | 'CHANNEL' | 'AGENT' | 'MODEL' | 'TOOL' | 'USER';

export interface AiAgentConfigResponse {
  id: string;
  category: string;
  key: string;
  value: string;
  valueType?: ConfigValueType;
  configGroup?: string;
  scopeType?: ScopeType;
  scopeRef?: string;
  description?: string;
  enabled?: boolean;
  status: UploadStorageStatus;
}

export interface AiAgentConfigCreateDto {
  category: string;
  key: string;
  value: string;
  valueType?: ConfigValueType;
  configGroup?: string;
  scopeType?: ScopeType;
  scopeRef?: string;
  description?: string;
  enabled?: boolean;
  status: UploadStorageStatus;
}

export interface AiAgentConfigUpdateDto {
  category?: string;
  key?: string;
  value?: string;
  valueType?: ConfigValueType;
  configGroup?: string;
  scopeType?: ScopeType;
  scopeRef?: string;
  description?: string;
  enabled?: boolean;
  status?: UploadStorageStatus;
}
