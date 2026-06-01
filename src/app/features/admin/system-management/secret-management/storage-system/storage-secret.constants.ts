import {StorageSecretCreateDto} from '../../../../../core/models/file-storage/storage-secret.model';

export const STORAGE_SECRET_ROUTES = {
  list: '/admin/file-storage/secrets',
  create: '/admin/file-storage/secrets/create'
} as const;

export const STORAGE_SECRET_INITIAL_VALUE: StorageSecretCreateDto = {
  category: '',
  name: '',
  code: '',
  secretValue: '',
  description: '',
  status: 'ACTIVE'
};
