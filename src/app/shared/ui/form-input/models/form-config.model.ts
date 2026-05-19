import { Signal, WritableSignal } from '@angular/core';

export type GridWidth = '1/2' | '1/3' | '1/4' | '1/6' | 'full';
export type FormDensity = 'compact' | 'comfortable' | 'spacious';

export interface FormContext {
  user: any;
  extra?: any;
  mode?: 'create' | 'edit' | 'view';
}

export interface ValidationRule {
  type?: 'required' | 'min' | 'max' | 'regex' | 'expression' | 'custom';
  expression?: string;
  value?: unknown;
  validator?: string;
  message: string;
  severity?: 'error' | 'warning';
}

export interface SelectOption {
  label: string;
  value: string | number | boolean | null;
  disabled?: boolean;
}

export interface FormValidationError {
  fieldPath?: string;
  message: string;
  severity?: 'error' | 'warning';
  nodeId?: string;
}

export interface FormValidationHelpers {
  flattenTree(value: unknown): TreeFormNode[];
  countTreeNodes(value: unknown): number;
  treeDepth(value: unknown): number;
  hasDuplicate(value: unknown, key: string): boolean;
  hasDisabledNode(value: unknown): boolean;
  findTreeNode(value: unknown, predicate: (node: TreeFormNode) => boolean): TreeFormNode | null;
}

export type FormCustomValidator = (
  value: unknown,
  context: {
    formValue: Record<string, unknown>;
    fieldKey: string;
    helpers: FormValidationHelpers;
  }
) => true | FormValidationError[];

export interface ArrayState {
  addItem(initialValue?: unknown): void;
  removeItem(id: number): void;
  moveItem(index: number, direction: -1 | 1): void;
}

export interface BaseFieldConfig {
  name: string;
  label?: string;
  description?: string;
  helpText?: string;
  sectionId?: string;
  required?: boolean;
  visibleWhen?: string;
  disabledWhen?: string;
  requiredWhen?: string;
  requiredWhenMessage?: string;
  width?: GridWidth;
  ui?: FieldUiConfig;
  rules?: {
    visible?: string;
    disabled?: string;
  };
  validation?: ValidationRule[];
}

export interface FieldUiConfig {
  helpText?: string;
  description?: string;
  readonlyType?: 'text' | 'number' | 'currency' | 'percent' | 'date' | 'datetime' | 'boolean' | 'badge' | 'copyable' | 'json';
  copyable?: boolean;
  masked?: boolean;
  prefix?: string;
  suffix?: string;
}

export interface TextFieldConfig extends BaseFieldConfig {
  type: 'text' | 'textarea' | 'json' | 'code';
  placeholder?: string;
  helpText?: string;
  rows?: number;
  maxRows?: number;
  showZoomButton?: boolean;
  contentType?: 'text' | 'json';
  jsonValidationMessage?: string;
}

export interface NumberFieldConfig extends BaseFieldConfig {
  type: 'number' | 'decimal' | 'percent' | 'currency';
  mode?: 'decimal' | 'currency';
  currency?: string;
  suffix?: string;
  prefix?: string;
  minFractionDigits?: number;
  maxFractionDigits?: number;
  step?: number;
}

export interface SelectFieldConfig extends BaseFieldConfig {
  type: 'select' | 'select-multi' | 'multi-select';
  options?: any[];
  optionsExpression?: string;
  placeholder?: string;
  showClear?: boolean;
}

export interface AutoCompleteFieldConfig extends BaseFieldConfig {
  type: 'auto-complete' | 'autocomplete';
  options?: SelectOption[];
  optionsExpression?: string;
  placeholder?: string;
  helpText?: string;
}

export interface RadioFieldConfig extends BaseFieldConfig {
  type: 'radio';
  options?: SelectOption[];
  optionsExpression?: string;
}

export interface GroupFieldConfig extends BaseFieldConfig {
  type: 'group';
  children: FieldConfig[];
  flat?: boolean;
  collapsible?: boolean;
  collapsed?: boolean;
  variant?: 'default' | 'muted' | 'warning' | 'danger';
  density?: 'compact' | 'comfortable';
}

export interface TreeBadge {
  label: string;
  variant: 'default' | 'info' | 'success' | 'warning' | 'danger' | 'muted';
}

export type TreeSelectionMode = 'single' | 'multiple' | 'checkbox';
export type TreeSelectStrategy = 'all' | 'leafOnly' | 'parentAndChildren';
export type TreeNodeStatus = 'active' | 'inactive' | 'disabled' | 'deprecated';
export type TreeNodeSeverity = 'normal' | 'warning' | 'danger' | 'critical';

export interface TreeSelectionPreset {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  nodeIds?: string[];
  clearBeforeApply?: boolean;
  match?: {
    labelIncludes?: string[];
    codeIncludes?: string[];
    typeIn?: string[];
    statusIn?: TreeNodeStatus[];
    severityIn?: TreeNodeSeverity[];
    leafOnly?: boolean;
  };
}

export interface TreeFormNode {
  id: string;
  key?: string;
  label: string;
  value: unknown;
  code?: string;
  path?: string;
  type?: string;
  status?: TreeNodeStatus;
  severity?: TreeNodeSeverity;
  subtitle?: string;
  description?: string;
  icon?: string;
  badges?: TreeBadge[];
  data?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  children?: TreeFormNode[];
  selectable?: boolean;
  checked?: boolean;
  indeterminate?: boolean;
  expanded?: boolean;
  loading?: boolean;
  hasChildren?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  readonly?: boolean;
}

export interface TreePickerOption {
  id: string;
  label: string;
  value: unknown;
  subtitle?: string;
  description?: string;
  icon?: string;
  badges?: TreeBadge[];
  disabled?: boolean;
  disabledReason?: string;
  data?: Record<string, unknown>;
  children?: TreePickerOption[];
}

export interface TreeFieldUiConfig {
  mode?: 'view' | 'select' | 'builder' | 'manage';
  selectionMode?: TreeSelectionMode;
  selectStrategy?: TreeSelectStrategy;
  searchable?: boolean;
  showSelectedPanel?: boolean;
  showFilterTabs?: boolean;
  showToolbar?: boolean;
  showNodeActions?: boolean;
  showPath?: boolean;
  showBadges?: boolean;
  showCounts?: boolean;
  lazy?: boolean;
  draggable?: boolean;
  virtualScroll?: boolean;
  loading?: boolean;
  error?: string | null;
  selectionPresets?: TreeSelectionPreset[];
  allowAddNode?: boolean;
  allowRemoveNode?: boolean;
  allowReplaceNode?: boolean;
  /**
   * Controls what happens to existing children when a node is replaced.
   * Defaults to keep-children so user-entered nested data is not dropped accidentally.
   */
  replaceBehavior?: 'keep-children' | 'drop-children' | 'ask';
  allowEditNode?: boolean;
  allowMoveNode?: boolean;
  allowDragDrop?: boolean;
  allowGroupNode?: boolean;
  readonly?: boolean;
  picker?: {
    enabled: boolean;
    mode?: 'drawer' | 'dialog' | 'inline';
    searchable?: boolean;
    filterable?: boolean;
    multiSelect?: boolean;
    loading?: boolean;
    error?: string | null;
  };
  nodeDisplay?: {
    showIcon?: boolean;
    showSubtitle?: boolean;
    showDescription?: boolean;
    showBadges?: boolean;
    showValidationIcon?: boolean;
  };
  advancedJson?: {
    enabled: boolean;
    editable?: boolean;
    collapsedByDefault?: boolean;
  };
  labels?: {
    addNode?: string;
    addGroup?: string;
    replace?: string;
    remove?: string;
    moveUp?: string;
    moveDown?: string;
    duplicate?: string;
    view?: string;
    expandAll?: string;
    collapseAll?: string;
    validate?: string;
    applyJson?: string;
    resetJson?: string;
    clear?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    searchPlaceholder?: string;
    searchEmptyTitle?: string;
    searchEmptyDescription?: string;
    clearSearch?: string;
    selectedEmptyTitle?: string;
    selectedEmptyDescription?: string;
    selectedPanelTitle?: string;
    expandSelected?: string;
    clearSelection?: string;
    removeSelected?: string;
    selectVisible?: string;
    selectDescendants?: string;
    unselectDescendants?: string;
    selectedOnly?: string;
    leafOnly?: string;
    presetTitle?: string;
    actionMenu?: string;
  };
}

export interface TreeFieldConfig extends BaseFieldConfig {
  type: 'tree';
  children?: FieldConfig[];
  treeConfig?: TreeFieldUiConfig;
  pickerOptions?: TreePickerOption[];
}

export interface ArrayFieldConfig extends BaseFieldConfig {
  type: 'array';
  itemConfig: FieldConfig[];
}

export interface CheckboxFieldConfig extends BaseFieldConfig {
  type: 'checkbox' | 'boolean';
}

export interface DateFieldConfig extends BaseFieldConfig {
  type: 'date' | 'datetime';
}

export interface RecordFieldConfig extends BaseFieldConfig {
  type: 'record';
  keyLabel?: string;
  valueLabel?: string;
  addButtonLabel?: string;
}

export interface TagsFieldConfig extends BaseFieldConfig {
  type: 'tags';
  options?: SelectOption[];
  optionsExpression?: string;
  placeholder?: string;
  helpText?: string;
}

export interface InputMultiFieldConfig extends BaseFieldConfig {
  type: 'input-multi';
  options?: SelectOption[];
  optionsExpression?: string;
  placeholder?: string;
  helpText?: string;
}

export interface SecretMetadataFieldConfig extends BaseFieldConfig {
  type: 'secret-metadata';
  optionsSource?: string;
  options?: SelectOption[];
  optionsExpression?: string;
  typeOptions?: SelectOption[];
  grantTypeOptions?: SelectOption[];
  addButtonLabel?: string;
  removeButtonLabel?: string;
  keyPlaceholder?: string;
  typePlaceholder?: string;
  valuePlaceholder?: string;
  secretPlaceholder?: string;
  grantTypePlaceholder?: string;
  tokenUrlPlaceholder?: string;
  clientIdPlaceholder?: string;
  clientSecretPlaceholder?: string;
  usernamePlaceholder?: string;
  passwordPlaceholder?: string;
  scopePlaceholder?: string;
}

export type FieldConfig =
  | TextFieldConfig
  | NumberFieldConfig
  | SelectFieldConfig
  | AutoCompleteFieldConfig
  | GroupFieldConfig
  | CheckboxFieldConfig
  | DateFieldConfig
  | RadioFieldConfig
  | ArrayFieldConfig
  | RecordFieldConfig
  | TagsFieldConfig
  | InputMultiFieldConfig
  | SecretMetadataFieldConfig
  | TreeFieldConfig;

export type FieldType =
  | 'text'
  | 'number'
  | 'decimal'
  | 'percent'
  | 'currency'
  | 'select'
  | 'group'
  | 'checkbox'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'radio'
  | 'select-multi'
  | 'multi-select'
  | 'auto-complete'
  | 'autocomplete'
  | 'textarea'
  | 'json'
  | 'code'
  | 'array'
  | 'record'
  | 'tags'
  | 'input-multi'
  | 'secret-metadata'
  | 'tree';

export interface FieldState<TModel = unknown> {
  fieldConfig: TModel;
  type: FieldType;
  name: string;
  label?: string;
  path: string;
  width?: GridWidth;
  value: Signal<any>;
  setValue(val: any): void;
  touched: WritableSignal<boolean>;
  focusing: WritableSignal<boolean>;
  blurred: WritableSignal<boolean>;
  dirty: WritableSignal<boolean>;
  externalErrors: WritableSignal<Record<string, string> | null>;
  visible: Signal<boolean>;
  disabled: Signal<boolean>;
  required: Signal<boolean>;
  options: Signal<SelectOption[]>;
  errors: Signal<Record<string, string> | null>;
  valid: Signal<boolean>;
  markAsTouched(): void;
  markAsFocused(): void;
  markAsBlurred(): void;
  arrayState?: ArrayState;
  groupName?: string;
}

export interface ArrayFieldState<TModel = unknown>
  extends FieldState<TModel> {
  children: Signal<FieldState[][]>;
}

export interface FormConfig {
  fields: FieldConfig[];
  title?: string;
  description?: string;
  sections?: FormSectionConfig[];
  layout?: FormLayoutConfig;
  actions?: FormActionConfig;
  validators?: Record<string, FormCustomValidator>;
}

export interface FormSectionConfig {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  order?: number;
  collapsible?: boolean;
  collapsed?: boolean;
  optional?: boolean;
  hiddenWhen?: string;
  disabledWhen?: string;
}

export interface FormLayoutConfig {
  mode?: 'simple' | 'sectioned' | 'smart' | 'wizard';
  density?: FormDensity;
  labelPlacement?: 'top' | 'left';
  sectionNavigation?: 'sidebar' | 'tabs' | 'dropdown' | 'none';
  showStatusPanel?: boolean;
  stickyFooter?: boolean;
  autoScrollToError?: boolean;
  showValidationSummary?: boolean;
  readonlyMode?: 'detail' | 'disabled-controls';
}

export interface FormActionConfig {
  submitLabel?: string;
  cancelLabel?: string;
  reviewErrorsLabel?: string;
  resetLabel?: string;
  showCancel?: boolean;
  showReset?: boolean;
  disableSubmitWhenInvalid?: boolean;
  submitDisabled?: boolean;
}

export interface FormResolvedSection {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  order: number;
  optional: boolean;
  disabled: boolean;
  collapsible: boolean;
  collapsed: boolean;
  fieldCount: number;
  errorCount: number;
  warningCount: number;
  completed: boolean;
  active: boolean;
}

export interface GroupFieldState extends FieldState {
  fieldConfig: GroupFieldConfig;
  children: FieldState[] | ArrayFieldState[];
}

export interface TreeFieldState extends FieldState {
  fieldConfig: TreeFieldConfig;
  children: FieldState[] | ArrayFieldState[];
}
