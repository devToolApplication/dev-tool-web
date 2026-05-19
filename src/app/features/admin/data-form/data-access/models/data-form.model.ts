export type DataFormStatus = 'ACTIVE' | 'INACTIVE';

export interface DataFormPermissions {
  create: string[];
  update: string[];
  importExport: string[];
}

export interface DataFormCreateRequest {
  formName: string;
  formCode: string;
  description?: string;
  status: DataFormStatus;
  jsonConfig: unknown;
  permissions: DataFormPermissions;
}

export interface DataFormResponse {
  id?: string;
  formName?: string;
  formCode?: string;
  description?: string;
  status?: DataFormStatus;
  jsonConfig?: unknown;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface DataFormCreateResponse {
  success?: boolean;
  id?: string;
  form?: DataFormResponse;
  dataForm?: DataFormResponse;
}

export interface DataFormCodeCheckResponse {
  exists?: boolean;
  duplicated?: boolean;
  available?: boolean;
}

export type DataFormValidationLevel = 'CRITICAL' | 'WARNING' | 'SUGGESTION';

export interface DataFormBackendValidationIssue {
  level?: DataFormValidationLevel;
  path?: string;
  message?: string;
}

export interface DataFormCreateErrorResponse {
  success?: false;
  errorMessage?: string;
  message?: string;
  errors?: DataFormBackendValidationIssue[];
  warnings?: DataFormBackendValidationIssue[];
  suggestions?: DataFormBackendValidationIssue[];
}
