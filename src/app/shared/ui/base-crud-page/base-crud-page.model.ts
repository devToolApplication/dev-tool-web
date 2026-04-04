export interface CrudPageActionConfig {
  id: string;
  label: string;
  icon?: string;
  buttonClass?: string;
  goBack?: boolean;
  disabled?: boolean;
  loading?: boolean;
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
