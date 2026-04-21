import { UploadStorageType } from './upload-storage.model';

export interface UploadFileResponse {
  id: string;
  storageId?: string;
  fileName?: string;
  fileUrl?: string;
  mimeType?: string;
  metaData?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadFileOptions {
  storageId?: string | null;
  storageType?: UploadStorageType | null;
  fileName?: string | null;
  metadata?: Record<string, string> | null;
}
