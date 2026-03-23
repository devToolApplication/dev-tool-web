import { StorageConfigCreateDto } from '../../../../../core/models/file-storage/storage-config.model';

export const STORAGE_CONFIG_ROUTES = {
  list: '/admin/system-management/storage-configs',
  create: '/admin/system-management/storage-configs/create'
} as const;

export const STORAGE_CONFIG_INITIAL_VALUE: StorageConfigCreateDto = {
  category: '',
  key: '',
  value: '{}',
  description: '',
  status: 'ACTIVE'
};
