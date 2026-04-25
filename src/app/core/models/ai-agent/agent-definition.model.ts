import { UploadStorageStatus } from '../file-storage/upload-storage.model';

export interface CodexAgentConfig {
  enabled?: boolean;
  model?: string;
  mode?: string;
  approvalPolicy?: string;
  workingDirectory?: string;
  additionalDirectories?: string[];
  skipGitRepoCheck?: boolean;
  networkAccessEnabled?: boolean;
  webSearchEnabled?: boolean;
  webSearchMode?: string;
  mcpServerIds?: string[];
  mcpToolKeys?: string[];
  skillIds?: string[];
  agentsInstruction?: string;
}

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
  codexConfig?: CodexAgentConfig;
  status?: UploadStorageStatus;
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
  codexConfig?: CodexAgentConfig;
  status?: UploadStorageStatus;
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
  codexConfig?: CodexAgentConfig;
  status?: UploadStorageStatus;
}
