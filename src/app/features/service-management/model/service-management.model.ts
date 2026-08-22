import type { FormConfig } from '@shared/ui/patterns/form-input/models/form-config.model';
import type { ActionToolbarAction } from '@shared/ui/layout/action-toolbar/action-toolbar.component';
import type { FilterPanelField } from '@shared/ui/layout/filter-panel/filter-panel.component';

import type { BadgeVariant } from '@shared/ui/data-display/badge/badge.component';
import type { TableConfig } from '@shared/ui/patterns/table/models/table-config.model';

export type ManagedServiceId = 'ai-agent-mcrs' | 'job-service';
export type ServiceResourceKind = 'secret' | 'config';
export type ServiceFormMode = 'create' | 'edit';
export type ServiceEnvironment = 'prod' | 'staging' | 'dev';
export type ServiceResourceStatus = 'active' | 'inactive' | 'rotating' | 'draft';
export type JobStatus = 'running' | 'paused' | 'failed' | 'idle';

export interface BreadcrumbItem {
  label: string;
  routerLink?: string | any[];
}

export interface ManagedServiceProfile {
  id: ManagedServiceId;
  name: string;
  shortName: string;
  description: string;
  routeSegment: string;
}

export interface ServiceResourceRecord {
  id: string;
  serviceId: ManagedServiceId;
  kind: ServiceResourceKind;
  name: string;
  key: string;
  environment: ServiceEnvironment;
  environmentLabel: string;
  status: ServiceResourceStatus;
  statusLabel: string;
  owner: string;
  updatedAt: string;
  description: string;
  type: string;
  typeLabel: string;
  version: string;
  endpoint?: string;
  maskedValue?: string;
  timeoutMs?: number;
  retryCount?: number;
  tags: string[];
  payload: Record<string, unknown>;
}

export interface ServiceResourceListScreen {
  service: ManagedServiceProfile;
  resourceKind: ServiceResourceKind;
  title: string;
  description: string;
  breadcrumb: BreadcrumbItem[];
  basePath: string;
  actions: ActionToolbarAction[];
  filters: FilterPanelField[];
  table: TableConfig;
  records: ServiceResourceRecord[];
}

export interface ServiceResourceFormScreen {
  mode: ServiceFormMode;
  service: ManagedServiceProfile;
  resourceKind: ServiceResourceKind;
  title: string;
  description: string;
  backLink: string;
  breadcrumb: BreadcrumbItem[];
  formConfig: FormConfig;
  model: Record<string, unknown>;
}

export interface ServiceMetric {
  label: string;
  value: string | number;
  trend?: string;
  trendVariant?: BadgeVariant;
}

export interface JobRecord {
  id: string;
  name: string;
  description: string;
  environment: ServiceEnvironment;
  environmentLabel: string;
  status: JobStatus;
  statusLabel: string;
  owner: string;
  schedule: string;
  timezone: string;
  handler: string;
  configRef: string;
  secretRef: string;
  lastRunAt: string;
  nextRunAt: string;
  durationMs: number;
  successRate: number;
  retryCount: number;
  enabled: boolean;
  payload: Record<string, unknown>;
}

export interface JobManagementScreen {
  title: string;
  description: string;
  breadcrumb: BreadcrumbItem[];
  actions: ActionToolbarAction[];
  filters: FilterPanelField[];
  metrics: ServiceMetric[];
  table: TableConfig;
  jobs: JobRecord[];
  formConfig: FormConfig;
}

export interface JobFormScreen {
  mode: ServiceFormMode;
  title: string;
  description: string;
  backLink: string;
  breadcrumb: BreadcrumbItem[];
  formConfig: FormConfig;
  model: Record<string, unknown>;
}


