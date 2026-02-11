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
