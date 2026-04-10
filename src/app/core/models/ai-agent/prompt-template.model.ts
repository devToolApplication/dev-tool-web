import { UploadStorageStatus } from '../file-storage/upload-storage.model';

export type PromptTemplateType = 'SYSTEM' | 'USER' | 'TOOL_PROTOCOL' | 'AGENT';

export interface PromptTemplateResponse {
  id: string;
  code: string;
  name: string;
  templateType: PromptTemplateType;
  content: string;
  version?: number;
  enabled?: boolean;
  status?: UploadStorageStatus;
}

export interface PromptTemplateCreateDto {
  code: string;
  name: string;
  templateType: PromptTemplateType;
  content: string;
  version?: number;
  enabled?: boolean;
  status?: UploadStorageStatus;
}

export interface PromptTemplateUpdateDto {
  code?: string;
  name?: string;
  templateType?: PromptTemplateType;
  content?: string;
  version?: number;
  enabled?: boolean;
  status?: UploadStorageStatus;
}
