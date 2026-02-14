import {Signal, WritableSignal} from '@angular/core';

export type GridWidth = '1/2' | '1/3' | '1/4' | '1/5' | '1/6' | 'full';

export type FieldConfig =
  | TextFieldConfig
  | NumberFieldConfig
  | SelectFieldConfig
  | GroupFieldConfig
  | ArrayFieldConfig;

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
  type: 'text' | 'number';
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
  fieldConfig: FieldConfig,
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
  options: Signal<SelectOption[] | null>;
  errors: Signal<Record<string, string> | null>;
  valid: Signal<boolean>;
  markAsTouched(): void;
  markAsFocused(): void;
  markAsBlurred(): void;
}

export interface ArrayState {
  addItem(initialValue?: unknown): void;
  removeItem(index: number): void;
}
