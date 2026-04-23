import { UploadStorageStatus } from '../file-storage/upload-storage.model';

export interface CodexSkillFile {
  path: string;
  content: string;
  contentType?: string;
}

export interface CodexSkillResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  files?: CodexSkillFile[];
  enabled?: boolean;
  status?: UploadStorageStatus;
}

export interface CodexSkillCreateDto {
  code: string;
  name: string;
  description?: string;
  files?: CodexSkillFile[];
  enabled?: boolean;
  status?: UploadStorageStatus;
}

export interface CodexSkillUpdateDto {
  code?: string;
  name?: string;
  description?: string;
  files?: CodexSkillFile[];
  enabled?: boolean;
  status?: UploadStorageStatus;
}
