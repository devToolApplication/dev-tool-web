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

export type FieldConfig =
  | TextFieldConfig
  | NumberFieldConfig
  | SelectFieldConfig
  | GroupFieldConfig
  | CheckboxFieldConfig
  | DateFieldConfig
  | RadioFieldConfig
  | ArrayFieldConfig;

export type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'group'
  | 'checkbox'
  | 'date'
  | 'radio'
  | 'select-multi'
  | 'textarea'
  | 'array';

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
