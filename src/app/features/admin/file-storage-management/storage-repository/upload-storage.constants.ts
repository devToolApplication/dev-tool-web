import { UploadStorageCreateDto } from '../../../../core/models/file-storage/upload-storage.model';

export const UPLOAD_STORAGE_INITIAL_VALUE: UploadStorageCreateDto = {
  name: '',
  description: '',
  storageType: 'PINATA',
  defaultActive: true,
  status: 'ACTIVE',
  apiDomain: '',
  apiPath: '',
  metadata: []
};
