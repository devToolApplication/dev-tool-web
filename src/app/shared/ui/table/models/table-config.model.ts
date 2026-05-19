import { Observable } from 'rxjs';
import { ValidationRule } from '../../form-input/models/form-config.model';

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

export interface TableAction {
  label: string;
  id?: string;
  icon?: string;
  tooltip?: string;
  tooltipFn?: (rowData: any) => string;
  showLabel?: boolean;
  text?: boolean;
  styleClass?: string;
  severity?: TableActionSeverity;
  variant?: 'default' | 'primary' | 'warning' | 'danger' | 'ghost';
  placement?: 'primary' | 'more';
  permissions?: readonly string[];
  permissionMode?: 'hide' | 'disable';
  permissionDeniedTooltip?: string;
  visible?: (rowData: any) => boolean;
  disabled?: (rowData: any) => boolean;
  confirm?: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'warning' | 'danger';
  };
  onClick: (rowData: any) => void;
}

export interface TableBulkAction {
  id: string;
  label: string;
  icon?: string;
  tooltip?: string;
  severity?: TableActionSeverity;
  variant?: 'default' | 'primary' | 'warning' | 'danger' | 'ghost';
  permissions?: readonly string[];
  permissionMode?: 'hide' | 'disable';
  permissionDeniedTooltip?: string;
  visible?: boolean;
  disabled?: boolean;
  confirm?: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'warning' | 'danger';
  };
  onClick?: (rows: any[]) => void;
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
  values: Record<string, any>;
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
  defaultValue?: any;
  dependsOn?: string[];
  queryParam?: string;
  queryParamStart?: string;
  queryParamEnd?: string;
  rules?: {
    visible?: string;
    disabled?: string;
  };
  validation?: ValidationRule[];
}

export interface TableFilterOptions {
  primaryField?: string;
  enableUrlSync?: boolean;
  drawerTitle?: string;
  applyLabel?: string;
  resetLabel?: string;
  filterLabel?: string;
  cancelLabel?: string;
}

export interface TableColumn {
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
  actions?: TableAction[];
  link?: string | ((rowData: any) => string | any[]);
  tooltip?: boolean | ((rowData: any) => string);
  valueGetter?: (rowData: any) => unknown;
  formatter?: (rowData: any, value: unknown) => string | number | null | undefined;
  badgeMap?: Record<string, TableBadgeVariant>;
  semanticFn?: (rowData: any, value: unknown) => 'positive' | 'negative' | 'neutral' | 'info' | 'warning' | 'danger';
  maxVisibleTags?: number;
  jsonDisplayMode?: 'button' | 'inline-preview';
  customTemplateKey?: string;
}

export interface TableSelectionConfig {
  mode: 'single' | 'multiple';
  showSelectAll?: boolean;
  selectAllScopeLabel?: string;
}

export interface TableConfig {
  columns: TableColumn[];
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyFilteredTitle?: string;
  emptyFilteredDescription?: string;
  errorTitle?: string;
  filters?: TableFilterField[];
  filterOptions?: TableFilterOptions;
  toolbar?: TableToolbarConfig;
  density?: TableDensity;
  pagination?: boolean;
  rowClickable?: boolean;
  rowKey?: string | ((rowData: any) => string | number | boolean | null | undefined);
  dataKey?: string | ((rowData: any) => string | number | boolean | null | undefined);
  selection?: TableSelectionConfig;
  rows?: number;
  rowsPerPageOptions?: number[];
  scrollable?: boolean;
  scrollHeight?: string;
  minWidth?: string;
  stateKey?: string;
}

export interface TableToolbarButtonConfig {
  visible?: boolean;
  label?: string;
  icon?: string;
  severity?: TableActionSeverity;
  disabled?: boolean;
  permissions?: readonly string[];
  permissionMode?: 'hide' | 'disable';
  permissionDeniedTooltip?: string;
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
  currentData?: boolean;
}

export interface TableToolbarConfig {
  new?: TableToolbarButtonConfig;
  delete?: TableToolbarButtonConfig;
  refresh?: TableToolbarButtonConfig;
  search?: TableToolbarSearchConfig;
  columnVisibility?: TableToolbarColumnVisibilityConfig;
  density?: TableToolbarDensityConfig;
  import?: TableToolbarImportConfig;
  export?: TableToolbarExportConfig;
  bulkActions?: TableBulkAction[];
}
