export const SYSTEM_STATUS_OPTIONS = [
  { label: 'ACTIVE', value: 'ACTIVE' },
  { label: 'INACTIVE', value: 'INACTIVE' },
  { label: 'DELETE', value: 'DELETE' }
] as const;

export const DEFAULT_TABLE_ROWS = 10;
export const DEFAULT_TABLE_ROWS_PER_PAGE = [5, 10, 20] as const;
