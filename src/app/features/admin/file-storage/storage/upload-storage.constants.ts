import { UploadStorageCreateDto, UploadStorageMetadataType } from '../../../../core/models/file-storage/upload-storage.model';

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

export const UPLOAD_STORAGE_METADATA_TYPE_OPTIONS: Array<{ label: string; value: UploadStorageMetadataType }> = [
  { label: 'Config', value: 'CONFIG' },
  { label: 'Secret', value: 'SECRET' }
];
