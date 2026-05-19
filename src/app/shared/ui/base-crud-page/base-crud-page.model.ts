export interface CrudPageActionConfig {
  id: string;
  label: string;
  icon?: string;
  buttonClass?: string;
  severity?: 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast' | null;
  text?: boolean;
  goBack?: boolean;
  backLink?: string | any[];
  disabled?: boolean;
  loading?: boolean;
  visible?: boolean;
  type?: 'button' | 'submit';
  submitForm?: boolean;
}

export interface CrudPageInfoSectionConfig {
  title: string;
  description?: string | null;
}

export interface CrudPageConfig {
  title: string;
  description?: string | null;
  actions?: CrudPageActionConfig[];
  infoSection?: CrudPageInfoSectionConfig | null;
}
