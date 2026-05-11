import { BasePageResponse } from '../base-response.model';

export type JobHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type JobAuthType = 'NONE' | 'BASIC' | 'API_KEY' | 'KEYCLOAK_CLIENT_CREDENTIALS';
export type JobRunStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
export type JobTriggerType = 'SCHEDULED' | 'MANUAL';

export interface JobTargetConfig {
  method: JobHttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}

export interface JobAuthConfig {
  type: JobAuthType;
  basic?: {
    username?: string;
    password?: string;
  };
  apiKey?: {
    headerName?: string;
    value?: string;
  };
  keycloak?: {
    baseUrl?: string;
    realm?: string;
    clientId?: string;
    clientSecret?: string;
    scope?: string;
    tokenField?: string;
    headerName?: string;
    headerPrefix?: string;
  };
}

export interface JobConfigResponse {
  id?: string;
  code: string;
  name: string;
  description?: string;
  cron: string;
  timezone: string;
  enabled: boolean;
  target: JobTargetConfig;
  auth: JobAuthConfig;
  retry?: {
    maxAttempts?: number;
  };
  lastRunAt?: string;
  lastStatus?: Exclude<JobRunStatus, 'RUNNING'> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobConfigFormModel {
  code: string;
  name: string;
  description?: string;
  cron: string;
  timezone: string;
  enabled: boolean;
  target: {
    method: JobHttpMethod;
    url: string;
    headers: Record<string, string>;
    body: string;
    timeoutMs: number;
  };
  auth: JobAuthConfig;
  retry: {
    maxAttempts: number;
  };
}

export interface JobConfigUpsertDto {
  code: string;
  name: string;
  description?: string;
  cron: string;
  timezone: string;
  enabled: boolean;
  target: JobTargetConfig;
  auth: JobAuthConfig;
  retry: {
    maxAttempts: number;
  };
}

export interface JobRunResponse {
  id: string;
  jobConfigId?: string;
  code: string;
  triggerType: JobTriggerType;
  status: JobRunStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  request?: {
    method?: string;
    url?: string;
    headers?: Record<string, unknown>;
    body?: unknown;
    authType?: JobAuthType;
  };
  response?: {
    status?: number;
    body?: unknown;
  };
  error?: {
    message?: string;
    stack?: string;
    status?: number;
    body?: unknown;
  } | null;
}

export interface JobAuthTypeFieldResponse {
  name: string;
  label: string;
  type: 'text' | 'password';
  required: boolean;
  placeholder?: string;
  defaultValue?: string;
}

export interface JobAuthTypeOptionResponse {
  type: JobAuthType;
  label: string;
  fields: JobAuthTypeFieldResponse[];
}

export interface JobAuthTypesResponse {
  authTypes: JobAuthTypeOptionResponse[];
}

export interface JobRunNowResponse {
  queued: boolean;
  code: string;
}

export type JobConfigPageResponse = BasePageResponse<JobConfigResponse>;
export type JobRunPageResponse = BasePageResponse<JobRunResponse>;

