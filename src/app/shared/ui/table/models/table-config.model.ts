export type TableColumnType =
  | 'text'
  | 'number'
  | 'date'
  | 'currency'
  | 'array'
  | 'group'
  | 'boolean'
  | 'actions';

export type TableActionSeverity = 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast' | null;

export interface TableAction {
  label: string;
  icon?: string;
  severity?: TableActionSeverity;
  disabled?: (rowData: any) => boolean;
  onClick: (rowData: any) => void;
}

export type TableFilterType = 'text' | 'select' | 'boolean';

export interface TableFilterOption {
  label: string;
  value: string | number | boolean;
}

export interface TableFilterField {
  field: string;
  label: string;
  type?: TableFilterType;
  placeholder?: string;
  options?: TableFilterOption[];
}

export interface TableColumn {
  field: string;
  header: string;
  type?: TableColumnType;   // mặc định là text
  sortable?: boolean;

  // optional config theo type
  format?: string;          // date format
  currencyCode?: string;    // currency
  actions?: TableAction[];
}

export interface TableConfig {
  columns: TableColumn[];
  title?: string;
  filters?: TableFilterField[];

  pagination?: boolean;
  rows?: number;
  rowsPerPageOptions?: number[];
}
