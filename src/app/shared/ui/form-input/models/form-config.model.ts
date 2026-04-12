import { Signal, WritableSignal } from '@angular/core';

export type GridWidth = '1/2' | '1/3' | '1/4' | '1/6' | 'full';

export interface FormContext {
  user: any;
  extra?: any;
  mode?: 'create' | 'edit' | 'view';
}

export interface ValidationRule {
  expression: string;
  message: string;
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface ArrayState {
  addItem(initialValue?: unknown): void;
  removeItem(id: number): void;
}

export interface BaseFieldConfig {
  name: string;
  label?: string;
  width?: GridWidth;
  rules?: {
    visible?: string;
    disabled?: string;
  };
  validation?: ValidationRule[];
}

export interface TextFieldConfig extends BaseFieldConfig {
  type: 'text' | 'textarea';
  placeholder?: string;
  helpText?: string;
  rows?: number;
  maxRows?: number;
  showZoomButton?: boolean;
  contentType?: 'text' | 'json';
  jsonValidationMessage?: string;
}

export interface NumberFieldConfig extends BaseFieldConfig {
  type: 'number';
  mode?: 'decimal' | 'currency';
  currency?: string;
  minFractionDigits?: number;
  maxFractionDigits?: number;
  step?: number;
}

export interface SelectFieldConfig extends BaseFieldConfig {
  type: 'select' | 'select-multi';
  options?: any[];
  optionsExpression?: string;
  placeholder?: string;
  showClear?: boolean;
}

export interface AutoCompleteFieldConfig extends BaseFieldConfig {
  type: 'auto-complete';
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
}

export interface TreeFieldConfig extends BaseFieldConfig {
  type: 'tree';
  children?: FieldConfig[];
}

export interface ArrayFieldConfig extends BaseFieldConfig {
  type: 'array';
  itemConfig: FieldConfig[];
}

export interface CheckboxFieldConfig extends BaseFieldConfig {
  type: 'checkbox';
}

export interface DateFieldConfig extends BaseFieldConfig {
  type: 'date';
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
  service?: 'ai-agent-mcrs' | 'file-mcrs';
  options?: SelectOption[];
  optionsExpression?: string;
  typeOptions?: SelectOption[];
  addButtonLabel?: string;
  keyPlaceholder?: string;
  typePlaceholder?: string;
  valuePlaceholder?: string;
  secretPlaceholder?: string;
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
  | 'select'
  | 'group'
  | 'checkbox'
  | 'date'
  | 'radio'
  | 'select-multi'
  | 'auto-complete'
  | 'textarea'
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
  visible: Signal<boolean>;
  disabled: Signal<boolean>;
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
}

export interface GroupFieldState extends FieldState {
  fieldConfig: GroupFieldConfig;
  children: FieldState[] | ArrayFieldState[];
}

export interface TreeFieldState extends FieldState {
  fieldConfig: TreeFieldConfig;
  children: FieldState[] | ArrayFieldState[];
}
