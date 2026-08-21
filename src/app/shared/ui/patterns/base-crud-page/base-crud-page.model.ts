import type { FormConfig } from '../form-input/models/form-config.model';

export interface BaseCrudPageActionConfig {
  id: string;
  label: string;
  icon?: string;
  kind: 'button' | 'submit';
  severity?: 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast' | null;
  disabled?: boolean;
  loading?: boolean;
  visible?: boolean;
}

export interface BaseCrudPageInfoSectionConfig {
  title: string;
  description?: string | null;
}

export interface BaseCrudPageConfig {
  title: string;
  description?: string | null;
  form: FormConfig;
  actions?: BaseCrudPageActionConfig[];
  infoSection?: BaseCrudPageInfoSectionConfig | null;
}
