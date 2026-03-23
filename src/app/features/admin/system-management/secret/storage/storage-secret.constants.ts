import {StorageSecretCreateDto} from '../../../../../core/models/file-storage/storage-secret.model';

export const STORAGE_SECRET_ROUTES = {
  list: '/admin/system-management/storage-secrets',
  create: '/admin/system-management/storage-secrets/create'
} as const;

export const STORAGE_SECRET_INITIAL_VALUE: StorageSecretCreateDto = {
  category: '',
  name: '',
  code: '',
  secretValue: '',
  description: '',
  status: 'ACTIVE'
};
