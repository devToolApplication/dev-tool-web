import {Signal, WritableSignal} from '@angular/core';

export type FieldConfig =
  | SimpleFieldConfig
  | SelectFieldConfig
  | GroupFieldConfig
  | ArrayFieldConfig;

export interface BaseFieldConfig {
  name: string;
  label?: string;
  rules?: {
    visible?: string;
    disabled?: string;
  };
  validation?: ValidationRule[];
}

export interface SimpleFieldConfig extends BaseFieldConfig {
  type: 'text' | 'number';
}

export interface SelectFieldConfig extends BaseFieldConfig {
  type: 'select';
  options?: any[];
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

export interface ValidationRule {
  expression: string;
  message: string;
}

export interface FormContext {
  user: any;
  extra?: any;
  mode?: 'create' | 'edit' | 'view';
}

export interface FieldRules {
  visible?: string;
  disabled?: string;
}

export interface SelectOption {
  label: string;
  value: unknown;
}

export interface FormConfig {
  fields: FieldConfig[];
}

export type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'group'
  | 'array';

export interface FieldState<TModel = unknown> {
  type: FieldType;
  name: string;
  label?: string;
  path: string;
  value: Signal<any>;
  setValue(val: any): void;
  touched: WritableSignal<boolean>;
  dirty: WritableSignal<boolean>;
  visible: Signal<boolean>;
  disabled: Signal<boolean>;
  options: Signal<SelectOption[] | null>;
  errors: Signal<Record<string, string> | null>;
  valid: Signal<boolean>;
  markAsTouched(): void;
}

export interface ArrayState {
  addItem(initialValue?: unknown): void;
  removeItem(index: number): void;
}
