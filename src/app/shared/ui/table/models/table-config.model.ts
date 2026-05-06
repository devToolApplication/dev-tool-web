import { Observable } from 'rxjs';
import { ValidationRule } from '../../form-input/models/form-config.model';

export type TableColumnType =
  | 'text'
  | 'number'
  | 'date'
  | 'currency'
  | 'array'
  | 'group'
  | 'textarea'
  | 'boolean'
  | 'actions';

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
  showLabel?: boolean;
  text?: boolean;
  styleClass?: string;
  severity?: TableActionSeverity;
  disabled?: (rowData: any) => boolean;
  onClick: (rowData: any) => void;
}

export type TableFilterType = 'text' | 'select' | 'multi-select' | 'boolean' | 'date' | 'date-range';

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
  sortable?: boolean;
  format?: string;
  suffix?: string;
  currencyCode?: string;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  frozen?: boolean;
  alignFrozen?: 'left' | 'right';
  actions?: TableAction[];
}

export interface TableConfig {
  columns: TableColumn[];
  title?: string;
  filters?: TableFilterField[];
  filterOptions?: TableFilterOptions;
  toolbar?: TableToolbarConfig;
  pagination?: boolean;
  rows?: number;
  rowsPerPageOptions?: number[];
  scrollable?: boolean;
  scrollHeight?: string;
  minWidth?: string;
}

export interface TableToolbarButtonConfig {
  visible?: boolean;
  label?: string;
  icon?: string;
  severity?: TableActionSeverity;
  disabled?: boolean;
}

export interface TableToolbarImportConfig extends TableToolbarButtonConfig {
  accept?: string;
  maxFileSize?: number;
  chooseLabel?: string;
}

export interface TableToolbarConfig {
  new?: TableToolbarButtonConfig;
  delete?: TableToolbarButtonConfig;
  import?: TableToolbarImportConfig;
  export?: TableToolbarButtonConfig;
}
