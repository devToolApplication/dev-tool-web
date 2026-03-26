export const SYSTEM_STATUS_OPTIONS = [
  { label: 'active', value: 'ACTIVE' },
  { label: 'inactive', value: 'INACTIVE' },
  { label: 'delete', value: 'DELETE' }
] as const;

export const DEFAULT_TABLE_ROWS = 10;
export const DEFAULT_TABLE_ROWS_PER_PAGE = [5, 10, 20] as const;
