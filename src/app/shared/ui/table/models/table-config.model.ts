export type TableColumnType =
  | 'text'
  | 'number'
  | 'date'
  | 'currency'
  | 'array'
  | 'group'
  | 'boolean';

export interface TableColumn {
  field: string;
  header: string;
  type?: TableColumnType;   // mặc định là text
  sortable?: boolean;

  // optional config theo type
  format?: string;          // date format
  currencyCode?: string;    // currency
}

export interface TableConfig {
  columns: TableColumn[];

  pagination?: boolean;
  rows?: number;
  rowsPerPageOptions?: number[];
}
