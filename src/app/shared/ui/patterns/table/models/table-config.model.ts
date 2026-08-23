import type { Observable } from 'rxjs';
import type { ValidationRule } from '../../validation/validation.model';

export type TableBadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'danger' | 'muted';
export type TableDensity = 'compact' | 'comfortable' | 'spacious';

export type TableColumnType =
  | 'text'
  | 'number'
  | 'semantic-number'
  | 'date'
  | 'datetime'
  | 'currency'
  | 'percent'
  | 'duration'
  | 'boolean'
  | 'badge'
  | 'tag-list'
  | 'copyable'
  | 'link'
  | 'json'
  | 'custom'
  | 'actions'
  | 'array'
  | 'group'
  | 'textarea';

export type TableActionSeverity =
  | 'secondary'
  | 'success'
  | 'info'
  | 'warn'
  | 'help'
  | 'danger'
  | 'contrast'
  | null;

export type TableExportScope = 'current-page' | 'external';
export type TableFilterValue = Record<string, unknown>;
export type TableRowLink = string | readonly unknown[];
export type TableRowKey = string | number | boolean | null | undefined;

export interface TableExportRequest<TRow = unknown> {
  scope: TableExportScope;
  filters: TableFilterValue;
  sortField: string | null;
  sortOrder: 1 | -1 | 0;
  visibleColumns: string[];
  rows: TRow[];
}

export interface TableCellTemplateContext<TRow = unknown> {
  $implicit: TRow;
  row: TRow;
  value: unknown;
  column: TableColumn<TRow>;
}

export interface TableAction<TRow = unknown> {
  label: string;
  id?: string;
  icon?: string;
  tooltip?: string;
  tooltipFn?: (rowData: TRow) => string;
  showLabel?: boolean;
  text?: boolean;
  styleClass?: string;
  severity?: TableActionSeverity;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'default' | 'warning' | 'danger';
  placement?: 'primary' | 'more';
  visible?: (rowData: TRow) => boolean;
  disabled?: (rowData: TRow) => boolean;
  onClick: (rowData: TRow) => void;
}

export interface TableBulkAction<TRow = unknown> {
  id: string;
  label: string;
  icon?: string;
  tooltip?: string;
  severity?: TableActionSeverity;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'default' | 'warning' | 'danger';
  visible?: boolean;
  disabled?: boolean;
  onClick?: (rows: TRow[]) => void;
}

export type TableFilterType =
  | 'text'
  | 'select'
  | 'multi-select'
  | 'boolean'
  | 'date'
  | 'date-range'
  | 'number-range'
  | 'autocomplete';

export interface TableFilterOption {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
}

export interface TableFilterContext {
  values: TableFilterValue;
  field: TableFilterField;
}

export type TableFilterOptionsLoader =
  | ((context: TableFilterContext) => TableFilterOption[])
  | ((context: TableFilterContext) => Promise<TableFilterOption[]>)
  | ((context: TableFilterContext) => Observable<TableFilterOption[]>);

export interface TableFilterField {
  field: string;
  label: string;
  type?: TableFilterType;
  placeholder?: string;
  options?: TableFilterOption[];
  optionsLoader?: TableFilterOptionsLoader;
  optionsExpression?: string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  hidden?: boolean;
  quick?: boolean;
  defaultValue?: unknown;
  dependsOn?: string[];
  rules?: {
    visible?: string;
    disabled?: string;
  };
  validation?: ValidationRule[];
}

export interface TableFilterOptions {
  primaryField?: string;
  drawerTitle?: string;
  applyLabel?: string;
  resetLabel?: string;
  filterLabel?: string;
  cancelLabel?: string;
}

export interface TableColumn<TRow = unknown> {
  field: string;
  header: string;
  type?: TableColumnType;
  visible?: boolean;
  hideable?: boolean;
  sortable?: boolean;
  format?: string;
  suffix?: string;
  prefix?: string;
  currencyCode?: string;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  align?: 'left' | 'center' | 'right';
  frozen?: boolean;
  alignFrozen?: 'left' | 'right';
  actions?: TableAction<TRow>[];
  link?: TableRowLink | ((rowData: TRow) => TableRowLink);
  tooltip?: boolean | ((rowData: TRow) => string);
  valueGetter?: (rowData: TRow) => unknown;
  formatter?: (rowData: TRow, value: unknown) => string | number | null | undefined;
  badgeMap?: Record<string, TableBadgeVariant>;
  semanticFn?: (
    rowData: TRow,
    value: unknown,
  ) => 'positive' | 'negative' | 'neutral' | 'info' | 'warning' | 'danger';
  maxVisibleTags?: number;
  jsonDisplayMode?: 'button' | 'inline-preview';
  customTemplateKey?: string;
}

export interface TableSelectionConfig {
  mode: 'single' | 'multiple';
  showSelectAll?: boolean;
  selectAllScopeLabel?: string;
}

export interface TableConfig<TRow = unknown> {
  columns: TableColumn<TRow>[];
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyFilteredTitle?: string;
  emptyFilteredDescription?: string;
  errorTitle?: string;
  filters?: TableFilterField[];
  filterOptions?: TableFilterOptions;
  toolbar?: TableToolbarConfig<TRow>;
  density?: TableDensity;
  pagination?: boolean;
  rowClickable?: boolean;
  rowKey?: string | ((rowData: TRow) => TableRowKey);
  dataKey?: string | ((rowData: TRow) => TableRowKey);
  selection?: TableSelectionConfig;
  rows?: number;
  rowsPerPageOptions?: number[];
  scrollable?: boolean;
  scrollHeight?: string;
  minWidth?: string;
}

export interface TableToolbarButtonConfig {
  visible?: boolean;
  disabled?: boolean;
  icon?: string;
  label?: string;
  tooltip?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
}
export interface TableToolbarSearchConfig {
  visible?: boolean;
  field?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export interface TableToolbarColumnVisibilityConfig {
  visible?: boolean;
  label?: string;
  placeholder?: string;
}

export interface TableToolbarDensityConfig {
  visible?: boolean;
  label?: string;
}

export interface TableToolbarImportConfig extends TableToolbarButtonConfig {
  accept?: string;
  maxFileSize?: number;
  chooseLabel?: string;
}

export interface TableToolbarExportConfig extends TableToolbarButtonConfig {
  fileName?: string;
  scope?: TableExportScope;
  currentData?: boolean;
}

export interface TableToolbarConfig<TRow = unknown> {
  new?: TableToolbarButtonConfig;
  delete?: TableToolbarButtonConfig;
  refresh?: TableToolbarButtonConfig;
  search?: TableToolbarSearchConfig;
  columnVisibility?: TableToolbarColumnVisibilityConfig;
  density?: TableToolbarDensityConfig;
  import?: TableToolbarImportConfig;
  export?: TableToolbarExportConfig;
  bulkActions?: TableBulkAction<TRow>[];
}
