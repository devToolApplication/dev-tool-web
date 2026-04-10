import { UploadStorageStatus } from '../file-storage/upload-storage.model';

export interface AgentDefinitionResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  systemPromptTemplateId?: string;
  modelConfigId?: string;
  executionPolicyId?: string;
  executionPolicyJson?: string;
  enabled?: boolean;
  defaultActive?: boolean;
  status?: UploadStorageStatus;
  toolIds: string[];
}

export interface AgentDefinitionCreateDto {
  code: string;
  name: string;
  description?: string;
  systemPromptTemplateId?: string;
  modelConfigId?: string;
  executionPolicyId?: string;
  executionPolicyJson?: string;
  enabled?: boolean;
  defaultActive?: boolean;
  status?: UploadStorageStatus;
  toolIds: string[];
}

export interface AgentDefinitionUpdateDto {
  code?: string;
  name?: string;
  description?: string;
  systemPromptTemplateId?: string;
  modelConfigId?: string;
  executionPolicyId?: string;
  executionPolicyJson?: string;
  enabled?: boolean;
  defaultActive?: boolean;
  status?: UploadStorageStatus;
  toolIds?: string[];
}
