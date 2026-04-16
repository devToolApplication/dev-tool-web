import { UploadStorageStatus } from '../file-storage/upload-storage.model';
import { ScopeType } from './ai-agent-config.model';

export interface AiAgentSecretResponse {
  id: string;
  category: string;
  name: string;
  code: string;
  secretValue: string;
  scopeType?: ScopeType;
  enabled?: boolean;
  rotationVersion?: number;
  description?: string;
  status: UploadStorageStatus;
}

export interface AiAgentSecretCreateDto {
  category: string;
  name: string;
  code: string;
  secretValue: string;
  scopeType?: ScopeType;
  enabled?: boolean;
  rotationVersion?: number;
  description?: string;
  status: UploadStorageStatus;
}

export interface AiAgentSecretUpdateDto {
  category?: string;
  name?: string;
  code?: string;
  secretValue?: string;
  scopeType?: ScopeType;
  enabled?: boolean;
  rotationVersion?: number;
  description?: string;
  status?: UploadStorageStatus;
}
