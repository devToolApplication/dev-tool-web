import type { BaseCrudPageConfig } from '@shared/ui/patterns/base-crud-page';
import type { ActionToolbarAction } from '@shared/ui/layout/action-toolbar/action-toolbar.component';
import type { FilterPanelField } from '@shared/ui/layout/filter-panel/filter-panel.component';
import type { KeyValueItem } from '@shared/ui/data-display/key-value-list/key-value-list.component';
import type { FormConfig } from '@shared/ui/patterns/form-input/models/form-config.model';
import type { TableAction, TableConfig } from '@shared/ui/patterns/table/models/table-config.model';
import {
  JobFormScreen,
  JobManagementScreen,
  JobRecord,
  JobStatus,
  ManagedServiceId,
  ManagedServiceProfile,
  ServiceEnvironment,
  ServiceFormMode,
  ServiceMetric,
  ServiceResourceFormScreen,
  ServiceResourceKind,
  ServiceResourceListScreen,
  ServiceResourceRecord,
  ServiceResourceStatus,
} from './service-management.model';

const SERVICE_PROFILES: Record<ManagedServiceId, ManagedServiceProfile> = {
  'ai-agent-mcrs': {
    id: 'ai-agent-mcrs',
    name: 'serviceManagement.aiAgent.name',
    shortName: 'AI Agent MCRS',
    description: 'serviceManagement.aiAgent.description',
    routeSegment: 'ai-agent-mcrs',
  },
  'job-service': {
    id: 'job-service',
    name: 'serviceManagement.job.name',
    shortName: 'Job Service',
    description: 'serviceManagement.job.description',
    routeSegment: 'job-service',
  },
};

const RESOURCE_SEGMENTS: Record<ServiceResourceKind, string> = {
  secret: 'secrets',
  config: 'configs',
};

const ENVIRONMENT_OPTIONS = [
  { label: 'serviceManagement.environment.prod', value: 'prod' },
  { label: 'serviceManagement.environment.staging', value: 'staging' },
  { label: 'serviceManagement.environment.dev', value: 'dev' },
];

const RESOURCE_STATUS_OPTIONS = [
  { label: 'serviceManagement.status.active', value: 'active' },
  { label: 'serviceManagement.status.inactive', value: 'inactive' },
  { label: 'serviceManagement.status.rotating', value: 'rotating' },
  { label: 'serviceManagement.status.draft', value: 'draft' },
];

const JOB_STATUS_OPTIONS = [
  { label: 'serviceManagement.jobStatus.running', value: 'running' },
  { label: 'serviceManagement.jobStatus.paused', value: 'paused' },
  { label: 'serviceManagement.jobStatus.failed', value: 'failed' },
  { label: 'serviceManagement.jobStatus.idle', value: 'idle' },
];

const SERVICE_RESOURCES: ServiceResourceRecord[] = [
  {
    id: 'ai-secret-openai-prod',
    serviceId: 'ai-agent-mcrs',
    kind: 'secret',
    name: 'OpenAI production token',
    key: 'ai.openai.prod.token',
    environment: 'prod',
    environmentLabel: 'serviceManagement.environment.prod',
    status: 'active',
    statusLabel: 'serviceManagement.status.active',
    owner: 'AI Platform',
    updatedAt: '2026-08-18T09:20:00+07:00',
    description: 'Token chính để gọi model production qua ai-agent-mcrs.',
    type: 'api-key',
    typeLabel: 'serviceManagement.secretType.apiKey',
    version: 'v12',
    maskedValue: 'sk-prod••••8YxQ',
    tags: ['openai', 'prod', 'llm'],
    payload: { provider: 'openai', scope: ['chat', 'responses'], rotationDays: 30 },
  },
  {
    id: 'ai-secret-keycloak-client',
    serviceId: 'ai-agent-mcrs',
    kind: 'secret',
    name: 'Keycloak client secret',
    key: 'ai.keycloak.client-secret',
    environment: 'prod',
    environmentLabel: 'serviceManagement.environment.prod',
    status: 'rotating',
    statusLabel: 'serviceManagement.status.rotating',
    owner: 'IAM',
    updatedAt: '2026-08-17T15:40:00+07:00',
    description: 'Client secret dùng để ai-agent-mcrs xác thực với Keycloak.',
    type: 'oauth',
    typeLabel: 'serviceManagement.secretType.oauth',
    version: 'v4',
    maskedValue: 'kc••••client',
    tags: ['keycloak', 'oauth'],
    payload: { grantType: 'client_credentials', tokenUrl: '/realms/dev/protocol/openid-connect/token' },
  },
  {
    id: 'ai-secret-crawl-staging',
    serviceId: 'ai-agent-mcrs',
    kind: 'secret',
    name: 'Crawler staging credential',
    key: 'ai.crawler.staging.basic',
    environment: 'staging',
    environmentLabel: 'serviceManagement.environment.staging',
    status: 'inactive',
    statusLabel: 'serviceManagement.status.inactive',
    owner: 'Data Ops',
    updatedAt: '2026-08-11T11:05:00+07:00',
    description: 'Thông tin truy cập crawler staging cho luồng thử nghiệm.',
    type: 'basic-auth',
    typeLabel: 'serviceManagement.secretType.basicAuth',
    version: 'v2',
    maskedValue: 'crawler••••stg',
    tags: ['crawler', 'staging'],
    payload: { username: 'crawler-staging' },
  },
  {
    id: 'ai-config-model-router',
    serviceId: 'ai-agent-mcrs',
    kind: 'config',
    name: 'Model router policy',
    key: 'ai.model-router.policy',
    environment: 'prod',
    environmentLabel: 'serviceManagement.environment.prod',
    status: 'active',
    statusLabel: 'serviceManagement.status.active',
    owner: 'AI Platform',
    updatedAt: '2026-08-19T08:10:00+07:00',
    description: 'Định tuyến request theo loại tác vụ, độ ưu tiên và fallback model.',
    type: 'json',
    typeLabel: 'serviceManagement.configType.json',
    version: 'v8',
    endpoint: '/api/agent/model-router',
    timeoutMs: 30000,
    retryCount: 2,
    tags: ['router', 'llm'],
    payload: { defaultModel: 'gpt-5.2', fallbackModel: 'gpt-5-mini', maxRetries: 2 },
  },
  {
    id: 'ai-config-mcp-registry',
    serviceId: 'ai-agent-mcrs',
    kind: 'config',
    name: 'MCP registry sync',
    key: 'ai.mcp.registry',
    environment: 'prod',
    environmentLabel: 'serviceManagement.environment.prod',
    status: 'active',
    statusLabel: 'serviceManagement.status.active',
    owner: 'Tooling',
    updatedAt: '2026-08-16T17:45:00+07:00',
    description: 'Cấu hình đồng bộ danh sách MCP server và tool capability.',
    type: 'yaml',
    typeLabel: 'serviceManagement.configType.yaml',
    version: 'v5',
    endpoint: '/api/mcp/registry',
    timeoutMs: 15000,
    retryCount: 3,
    tags: ['mcp', 'registry'],
    payload: { syncIntervalMinutes: 10, healthCheck: true },
  },
  {
    id: 'ai-config-agent-quota-dev',
    serviceId: 'ai-agent-mcrs',
    kind: 'config',
    name: 'Agent quota dev',
    key: 'ai.agent.quota.dev',
    environment: 'dev',
    environmentLabel: 'serviceManagement.environment.dev',
    status: 'draft',
    statusLabel: 'serviceManagement.status.draft',
    owner: 'AI Platform',
    updatedAt: '2026-08-12T10:30:00+07:00',
    description: 'Giới hạn thử nghiệm số phiên agent đồng thời trong môi trường dev.',
    type: 'properties',
    typeLabel: 'serviceManagement.configType.properties',
    version: 'v1',
    endpoint: '/api/agent/quota',
    timeoutMs: 5000,
    retryCount: 1,
    tags: ['quota', 'dev'],
    payload: { maxSessions: 8, maxToolCalls: 120 },
  },
  {
    id: 'job-secret-mongo-prod',
    serviceId: 'job-service',
    kind: 'secret',
    name: 'Mongo production credential',
    key: 'job.mongo.prod.credential',
    environment: 'prod',
    environmentLabel: 'serviceManagement.environment.prod',
    status: 'active',
    statusLabel: 'serviceManagement.status.active',
    owner: 'DBA',
    updatedAt: '2026-08-18T14:15:00+07:00',
    description: 'Credential đọc/ghi metadata job scheduler trong MongoDB.',
    type: 'basic-auth',
    typeLabel: 'serviceManagement.secretType.basicAuth',
    version: 'v7',
    maskedValue: 'mongo••••prod',
    tags: ['mongodb', 'prod'],
    payload: { database: 'job_scheduler', username: 'job_service' },
  },
  {
    id: 'job-secret-kafka-producer',
    serviceId: 'job-service',
    kind: 'secret',
    name: 'Kafka producer SASL',
    key: 'job.kafka.producer.sasl',
    environment: 'prod',
    environmentLabel: 'serviceManagement.environment.prod',
    status: 'rotating',
    statusLabel: 'serviceManagement.status.rotating',
    owner: 'Platform',
    updatedAt: '2026-08-15T09:00:00+07:00',
    description: 'Secret dùng để publish sự kiện job lifecycle lên Kafka.',
    type: 'api-key',
    typeLabel: 'serviceManagement.secretType.apiKey',
    version: 'v3',
    maskedValue: 'kfk••••prd',
    tags: ['kafka', 'producer'],
    payload: { mechanism: 'SCRAM-SHA-512', topicPrefix: 'jobs.' },
  },
  {
    id: 'job-secret-webhook-dev',
    serviceId: 'job-service',
    kind: 'secret',
    name: 'Webhook dev token',
    key: 'job.webhook.dev.token',
    environment: 'dev',
    environmentLabel: 'serviceManagement.environment.dev',
    status: 'draft',
    statusLabel: 'serviceManagement.status.draft',
    owner: 'Job Ops',
    updatedAt: '2026-08-10T13:25:00+07:00',
    description: 'Bearer token thử nghiệm gọi callback webhook sau khi job chạy xong.',
    type: 'raw',
    typeLabel: 'serviceManagement.secretType.raw',
    version: 'v1',
    maskedValue: 'dev••••hook',
    tags: ['webhook', 'dev'],
    payload: { header: 'Authorization' },
  },
  {
    id: 'job-config-runtime',
    serviceId: 'job-service',
    kind: 'config',
    name: 'Runtime defaults',
    key: 'job.runtime.defaults',
    environment: 'prod',
    environmentLabel: 'serviceManagement.environment.prod',
    status: 'active',
    statusLabel: 'serviceManagement.status.active',
    owner: 'Job Ops',
    updatedAt: '2026-08-19T12:00:00+07:00',
    description: 'Timeout, retry và concurrency mặc định cho job scheduler.',
    type: 'json',
    typeLabel: 'serviceManagement.configType.json',
    version: 'v10',
    endpoint: '/api/jobs/runtime-defaults',
    timeoutMs: 60000,
    retryCount: 3,
    tags: ['runtime', 'scheduler'],
    payload: { maxConcurrency: 12, retryBackoffSeconds: 30, timeoutSeconds: 600 },
  },
  {
    id: 'job-config-notification',
    serviceId: 'job-service',
    kind: 'config',
    name: 'Notification policy',
    key: 'job.notification.policy',
    environment: 'prod',
    environmentLabel: 'serviceManagement.environment.prod',
    status: 'active',
    statusLabel: 'serviceManagement.status.active',
    owner: 'SRE',
    updatedAt: '2026-08-14T16:50:00+07:00',
    description: 'Cấu hình gửi cảnh báo khi job fail hoặc chạy quá SLA.',
    type: 'json',
    typeLabel: 'serviceManagement.configType.json',
    version: 'v6',
    endpoint: '/api/jobs/notifications',
    timeoutMs: 10000,
    retryCount: 2,
    tags: ['alert', 'sla'],
    payload: { channels: ['slack', 'email'], notifyAfterFailures: 2 },
  },
  {
    id: 'job-config-worker-dev',
    serviceId: 'job-service',
    kind: 'config',
    name: 'Worker dev pool',
    key: 'job.worker.dev.pool',
    environment: 'dev',
    environmentLabel: 'serviceManagement.environment.dev',
    status: 'inactive',
    statusLabel: 'serviceManagement.status.inactive',
    owner: 'Job Ops',
    updatedAt: '2026-08-09T10:15:00+07:00',
    description: 'Cấu hình pool worker nhẹ cho môi trường dev.',
    type: 'properties',
    typeLabel: 'serviceManagement.configType.properties',
    version: 'v2',
    endpoint: '/api/jobs/workers/dev',
    timeoutMs: 5000,
    retryCount: 0,
    tags: ['worker', 'dev'],
    payload: { minWorkers: 1, maxWorkers: 3 },
  },
];

const JOBS: JobRecord[] = [
  {
    id: 'job-sync-agent-capabilities',
    name: 'Sync agent capabilities',
    description: 'Đồng bộ capability từ MCP registry vào ai-agent-mcrs.',
    environment: 'prod',
    environmentLabel: 'serviceManagement.environment.prod',
    status: 'running',
    statusLabel: 'serviceManagement.jobStatus.running',
    owner: 'Tooling',
    schedule: '*/10 * * * *',
    timezone: 'Asia/Bangkok',
    handler: 'mcpCapabilitySyncHandler',
    configRef: 'job-config-runtime',
    secretRef: 'job-secret-kafka-producer',
    lastRunAt: '2026-08-20T16:20:00+07:00',
    nextRunAt: '2026-08-20T16:30:00+07:00',
    durationMs: 242000,
    successRate: 99.1,
    retryCount: 1,
    enabled: true,
    payload: { batchSize: 200, source: 'mcp-registry' },
  },
  {
    id: 'job-refresh-model-metrics',
    name: 'Refresh model metrics',
    description: 'Tổng hợp usage, latency và error rate của model theo giờ.',
    environment: 'prod',
    environmentLabel: 'serviceManagement.environment.prod',
    status: 'idle',
    statusLabel: 'serviceManagement.jobStatus.idle',
    owner: 'AI Platform',
    schedule: '0 * * * *',
    timezone: 'Asia/Bangkok',
    handler: 'modelMetricsRefreshHandler',
    configRef: 'ai-config-model-router',
    secretRef: 'ai-secret-openai-prod',
    lastRunAt: '2026-08-20T16:00:00+07:00',
    nextRunAt: '2026-08-20T17:00:00+07:00',
    durationMs: 61000,
    successRate: 98.4,
    retryCount: 2,
    enabled: true,
    payload: { windowHours: 1 },
  },
  {
    id: 'job-send-failure-digest',
    name: 'Send failure digest',
    description: 'Gửi digest lỗi job định kỳ cho đội vận hành.',
    environment: 'prod',
    environmentLabel: 'serviceManagement.environment.prod',
    status: 'failed',
    statusLabel: 'serviceManagement.jobStatus.failed',
    owner: 'SRE',
    schedule: '*/30 * * * *',
    timezone: 'Asia/Bangkok',
    handler: 'failureDigestHandler',
    configRef: 'job-config-notification',
    secretRef: 'job-secret-webhook-dev',
    lastRunAt: '2026-08-20T16:00:00+07:00',
    nextRunAt: '2026-08-20T16:30:00+07:00',
    durationMs: 2100,
    successRate: 92.7,
    retryCount: 3,
    enabled: true,
    payload: { channel: 'ops-alerts', minSeverity: 'warning' },
  },
  {
    id: 'job-clean-dev-artifacts',
    name: 'Clean dev artifacts',
    description: 'Dọn artifact thử nghiệm và log tạm trong môi trường dev.',
    environment: 'dev',
    environmentLabel: 'serviceManagement.environment.dev',
    status: 'paused',
    statusLabel: 'serviceManagement.jobStatus.paused',
    owner: 'Job Ops',
    schedule: '0 2 * * *',
    timezone: 'Asia/Bangkok',
    handler: 'devArtifactCleanupHandler',
    configRef: 'job-config-worker-dev',
    secretRef: 'job-secret-webhook-dev',
    lastRunAt: '2026-08-19T02:00:00+07:00',
    nextRunAt: '2026-08-21T02:00:00+07:00',
    durationMs: 740000,
    successRate: 100,
    retryCount: 0,
    enabled: false,
    payload: { retentionDays: 7 },
  },
];

export function buildServiceResourceListScreen(
  serviceId: ManagedServiceId,
  resourceKind: ServiceResourceKind,
): ServiceResourceListScreen {
  const service = SERVICE_PROFILES[serviceId];
  const resourceLabel = resourceKind === 'secret' ? 'serviceManagement.resource.secret' : 'serviceManagement.resource.config';
  const basePath = `/${service.routeSegment}/${RESOURCE_SEGMENTS[resourceKind]}`;
  const serviceKey = serviceId === 'ai-agent-mcrs' ? 'aiAgent' : 'job';
  const resourceKey = resourceKind === 'secret' ? 'secret' : 'config';

  return {
    service,
    resourceKind,
    title: `serviceManagement.${serviceKey}.${resourceKey}.title`,
    description: `serviceManagement.${serviceKey}.${resourceKey}.description`,
    breadcrumb: [
      { label: service.name },
      { label: resourceLabel, routerLink: basePath },
    ],
    basePath,
    actions: buildListActions(),
    filters: buildResourceFilters(resourceKind),
    table: buildResourceTable(resourceKind),
    records: SERVICE_RESOURCES.filter((record) => record.serviceId === serviceId && record.kind === resourceKind),
  };
}

export function buildServiceResourceFormScreen(
  serviceId: ManagedServiceId,
  resourceKind: ServiceResourceKind,
  mode: ServiceFormMode,
  recordId?: string,
): ServiceResourceFormScreen {
  const listScreen = buildServiceResourceListScreen(serviceId, resourceKind);
  const record = recordId ? listScreen.records.find((item) => item.id === recordId) : undefined;
  const resourceKey = resourceKind === 'secret' ? 'secret' : 'config';
  const serviceKey = serviceId === 'ai-agent-mcrs' ? 'aiAgent' : 'job';
  const model = record ? resourceToFormModel(record) : defaultResourceModel(serviceId, resourceKind);
  const title = `serviceManagement.${serviceKey}.${resourceKey}.${mode === 'create' ? 'createTitle' : 'editTitle'}`;

  return {
    mode,
    service: listScreen.service,
    resourceKind,
    title,
    description: `serviceManagement.${serviceKey}.${resourceKey}.formDescription`,
    backLink: listScreen.basePath,
    breadcrumb: [
      ...listScreen.breadcrumb,
      { label: mode === 'create' ? 'layout.route.create' : 'layout.route.edit' },
    ],
    crudConfig: {
      title,
      description: `serviceManagement.${serviceKey}.${resourceKey}.formDescription`,
      infoSection: {
        title: 'serviceManagement.form.ownerTitle',
        description: 'serviceManagement.form.ownerDescription',
      },
      actions: buildFormActions(),
      form: resourceKind === 'secret' ? buildSecretFormConfig() : buildConfigFormConfig(),
    },
    model,
  };
}

export function buildJobManagementScreen(): JobManagementScreen {
  const metrics = buildJobMetrics(JOBS);

  return {
    title: 'serviceManagement.jobManagement.title',
    description: 'serviceManagement.jobManagement.description',
    breadcrumb: [
      { label: SERVICE_PROFILES['job-service'].name },
      { label: 'serviceManagement.jobManagement.breadcrumb', routerLink: '/job-service/jobs' },
    ],
    actions: buildListActions('serviceManagement.jobManagement.create'),
    filters: buildJobFilters(),
    metrics,
    table: buildJobTable(),
    jobs: JOBS,
    form: buildJobCrudConfig('create'),
  };
}

export function buildJobFormScreen(mode: ServiceFormMode, jobId?: string): JobFormScreen {
  const job = jobId ? JOBS.find((item) => item.id === jobId) : undefined;
  const title = mode === 'create' ? 'serviceManagement.jobManagement.createTitle' : 'serviceManagement.jobManagement.editTitle';

  return {
    mode,
    title,
    description: 'serviceManagement.jobManagement.formDescription',
    backLink: '/job-service/jobs',
    breadcrumb: [
      { label: SERVICE_PROFILES['job-service'].name },
      { label: 'serviceManagement.jobManagement.breadcrumb', routerLink: '/job-service/jobs' },
      { label: mode === 'create' ? 'layout.route.create' : 'layout.route.edit' },
    ],
    crudConfig: buildJobCrudConfig(mode),
    model: job ? jobToFormModel(job) : defaultJobModel(),
  };
}

export function filterServiceResources(
  records: readonly ServiceResourceRecord[],
  filters: Record<string, unknown>,
): ServiceResourceRecord[] {
  const keyword = normalizedText(filters['keyword']);
  const environment = filters['environment'];
  const status = filters['status'];
  const owner = normalizedText(filters['owner']);

  return records.filter((record) => {
    const matchesKeyword =
      !keyword ||
      [record.name, record.key, record.owner, record.description, record.endpoint, record.type, ...record.tags]
        .filter((value): value is string => typeof value === 'string')
        .some((value) => value.toLowerCase().includes(keyword));
    const matchesEnvironment = !environment || record.environment === environment;
    const matchesStatus = !status || record.status === status;
    const matchesOwner = !owner || record.owner.toLowerCase().includes(owner);

    return matchesKeyword && matchesEnvironment && matchesStatus && matchesOwner;
  });
}

export function filterJobs(jobs: readonly JobRecord[], filters: Record<string, unknown>): JobRecord[] {
  const keyword = normalizedText(filters['keyword']);
  const environment = filters['environment'];
  const status = filters['status'];
  const owner = normalizedText(filters['owner']);

  return jobs.filter((job) => {
    const matchesKeyword =
      !keyword ||
      [job.name, job.id, job.owner, job.description, job.handler, job.configRef, job.secretRef]
        .some((value) => value.toLowerCase().includes(keyword));
    const matchesEnvironment = !environment || job.environment === environment;
    const matchesStatus = !status || job.status === status;
    const matchesOwner = !owner || job.owner.toLowerCase().includes(owner);

    return matchesKeyword && matchesEnvironment && matchesStatus && matchesOwner;
  });
}

export function resourceDetailItems(record: ServiceResourceRecord): KeyValueItem[] {
  return [
    { label: 'serviceManagement.field.name', value: record.name },
    { label: 'serviceManagement.field.key', value: record.key, copyable: true },
    { label: 'serviceManagement.field.environment', value: record.environmentLabel, type: 'badge', variant: environmentVariant(record.environment) },
    { label: 'serviceManagement.field.status', value: record.statusLabel, type: 'badge', variant: resourceStatusVariant(record.status) },
    { label: 'serviceManagement.field.type', value: record.typeLabel },
    { label: 'serviceManagement.field.owner', value: record.owner },
    { label: 'serviceManagement.field.version', value: record.version },
    { label: 'serviceManagement.field.updatedAt', value: record.updatedAt, type: 'datetime' },
    { label: 'serviceManagement.field.endpoint', value: record.endpoint },
    { label: 'serviceManagement.field.timeoutMs', value: record.timeoutMs, type: 'number', suffix: ' ms' },
    { label: 'serviceManagement.field.retryCount', value: record.retryCount, type: 'number' },
  ];
}

export function jobDetailItems(job: JobRecord): KeyValueItem[] {
  return [
    { label: 'serviceManagement.field.name', value: job.name },
    { label: 'serviceManagement.field.environment', value: job.environmentLabel, type: 'badge', variant: environmentVariant(job.environment) },
    { label: 'serviceManagement.field.status', value: job.statusLabel, type: 'badge', variant: jobStatusVariant(job.status) },
    { label: 'serviceManagement.field.owner', value: job.owner },
    { label: 'serviceManagement.field.schedule', value: job.schedule, copyable: true },
    { label: 'serviceManagement.field.timezone', value: job.timezone },
    { label: 'serviceManagement.field.handler', value: job.handler, copyable: true },
    { label: 'serviceManagement.field.configRef', value: job.configRef, copyable: true },
    { label: 'serviceManagement.field.secretRef', value: job.secretRef, copyable: true },
    { label: 'serviceManagement.field.lastRunAt', value: job.lastRunAt, type: 'datetime' },
    { label: 'serviceManagement.field.nextRunAt', value: job.nextRunAt, type: 'datetime' },
    { label: 'serviceManagement.field.successRate', value: job.successRate / 100, type: 'percent' },
    { label: 'serviceManagement.field.duration', value: job.durationMs, type: 'number', suffix: ' ms' },
  ];
}

export function findServiceResource(
  serviceId: ManagedServiceId,
  resourceKind: ServiceResourceKind,
  recordId: string,
): ServiceResourceRecord | undefined {
  return SERVICE_RESOURCES.find((record) => record.serviceId === serviceId && record.kind === resourceKind && record.id === recordId);
}

export function findJob(jobId: string): JobRecord | undefined {
  return JOBS.find((job) => job.id === jobId);
}

function buildListActions(createLabel = 'create'): ActionToolbarAction[] {
  return [
    { id: 'create', label: createLabel, icon: 'pi pi-plus', placement: 'primary', variant: 'primary' },
    { id: 'refresh', label: 'refresh', icon: 'pi pi-refresh', placement: 'secondary', variant: 'ghost' },
  ];
}

function buildFormActions(): BaseCrudPageConfig['actions'] {
  return [
    { id: 'cancel', label: 'cancel', icon: 'pi pi-arrow-left', kind: 'button', severity: 'secondary' },
    { id: 'save', label: 'save', icon: 'pi pi-check', kind: 'submit', severity: 'info' },
  ];
}

function buildResourceFilters(resourceKind: ServiceResourceKind): FilterPanelField[] {
  return [
    {
      key: 'keyword',
      label: 'serviceManagement.filter.keyword',
      type: 'text',
      placeholder: resourceKind === 'secret'
        ? 'serviceManagement.filter.secretKeywordPlaceholder'
        : 'serviceManagement.filter.configKeywordPlaceholder',
    },
    {
      key: 'environment',
      label: 'serviceManagement.field.environment',
      type: 'select',
      options: [{ label: 'all', value: '' }, ...ENVIRONMENT_OPTIONS],
    },
    {
      key: 'status',
      label: 'serviceManagement.field.status',
      type: 'select',
      options: [{ label: 'all', value: '' }, ...RESOURCE_STATUS_OPTIONS],
    },
    {
      key: 'owner',
      label: 'serviceManagement.field.owner',
      type: 'text',
      placeholder: 'serviceManagement.filter.ownerPlaceholder',
      advanced: true,
    },
  ];
}

function buildJobFilters(): FilterPanelField[] {
  return [
    {
      key: 'keyword',
      label: 'serviceManagement.filter.keyword',
      type: 'text',
      placeholder: 'serviceManagement.filter.jobKeywordPlaceholder',
    },
    {
      key: 'environment',
      label: 'serviceManagement.field.environment',
      type: 'select',
      options: [{ label: 'all', value: '' }, ...ENVIRONMENT_OPTIONS],
    },
    {
      key: 'status',
      label: 'serviceManagement.field.status',
      type: 'select',
      options: [{ label: 'all', value: '' }, ...JOB_STATUS_OPTIONS],
    },
    {
      key: 'owner',
      label: 'serviceManagement.field.owner',
      type: 'text',
      placeholder: 'serviceManagement.filter.ownerPlaceholder',
      advanced: true,
    },
  ];
}

function buildResourceTable(resourceKind: ServiceResourceKind): TableConfig {
  const actions = buildResourceRowActions();

  return {
    title: resourceKind === 'secret' ? 'serviceManagement.table.secrets' : 'serviceManagement.table.configs',
    rowClickable: true,
    pagination: true,
    rows: 10,
    stateKey: `service-management-${resourceKind}`,
    emptyTitle: 'serviceManagement.empty.title',
    emptyDescription: 'serviceManagement.empty.description',
    columns: [
      { field: 'name', header: 'serviceManagement.field.name', type: 'text', minWidth: '14rem', sortable: true },
      { field: 'key', header: 'serviceManagement.field.key', type: 'copyable', minWidth: '13rem' },
      {
        field: 'environmentLabel',
        header: 'serviceManagement.field.environment',
        type: 'badge',
        badgeMap: {
          'serviceManagement.environment.prod': 'info',
          'serviceManagement.environment.staging': 'warning',
          'serviceManagement.environment.dev': 'muted',
        },
        width: '8rem',
      },
      {
        field: 'statusLabel',
        header: 'serviceManagement.field.status',
        type: 'badge',
        badgeMap: {
          'serviceManagement.status.active': 'success',
          'serviceManagement.status.inactive': 'muted',
          'serviceManagement.status.rotating': 'warning',
          'serviceManagement.status.draft': 'info',
        },
        width: '9rem',
      },
      { field: 'typeLabel', header: 'serviceManagement.field.type', type: 'text', minWidth: '9rem' },
      { field: 'owner', header: 'serviceManagement.field.owner', type: 'text', minWidth: '8rem' },
      { field: 'updatedAt', header: 'serviceManagement.field.updatedAt', type: 'datetime', width: '11rem', sortable: true },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        width: '9rem',
        align: 'right',
        frozen: true,
        alignFrozen: 'right',
        actions,
      },
    ],
  };
}

function buildJobTable(): TableConfig {
  return {
    title: 'serviceManagement.jobManagement.tableTitle',
    rowClickable: true,
    pagination: true,
    rows: 10,
    stateKey: 'service-management-jobs',
    emptyTitle: 'serviceManagement.empty.jobsTitle',
    emptyDescription: 'serviceManagement.empty.jobsDescription',
    columns: [
      { field: 'name', header: 'serviceManagement.field.name', type: 'text', minWidth: '15rem', sortable: true },
      {
        field: 'statusLabel',
        header: 'serviceManagement.field.status',
        type: 'badge',
        badgeMap: {
          'serviceManagement.jobStatus.running': 'success',
          'serviceManagement.jobStatus.paused': 'warning',
          'serviceManagement.jobStatus.failed': 'danger',
          'serviceManagement.jobStatus.idle': 'muted',
        },
        width: '9rem',
      },
      {
        field: 'environmentLabel',
        header: 'serviceManagement.field.environment',
        type: 'badge',
        badgeMap: {
          'serviceManagement.environment.prod': 'info',
          'serviceManagement.environment.staging': 'warning',
          'serviceManagement.environment.dev': 'muted',
        },
        width: '8rem',
      },
      { field: 'schedule', header: 'serviceManagement.field.schedule', type: 'copyable', minWidth: '9rem' },
      { field: 'lastRunAt', header: 'serviceManagement.field.lastRunAt', type: 'datetime', width: '11rem' },
      { field: 'nextRunAt', header: 'serviceManagement.field.nextRunAt', type: 'datetime', width: '11rem' },
      { field: 'successRate', header: 'serviceManagement.field.successRate', type: 'percent', format: '1.0-1', width: '8rem' },
      { field: 'durationMs', header: 'serviceManagement.field.duration', type: 'duration', width: '8rem' },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        width: '11rem',
        align: 'right',
        frozen: true,
        alignFrozen: 'right',
        actions: buildJobRowActions(),
      },
    ],
  };
}

function buildResourceRowActions(): TableAction[] {
  return [
    { id: 'view', label: 'view', icon: 'pi pi-eye', variant: 'ghost', onClick: () => undefined },
    { id: 'edit', label: 'edit', icon: 'pi pi-pencil', variant: 'ghost', onClick: () => undefined },
    { id: 'rotate', label: 'serviceManagement.action.rotate', icon: 'pi pi-sync', variant: 'ghost', visible: (row) => row.kind === 'secret', onClick: () => undefined },
  ];
}

function buildJobRowActions(): TableAction[] {
  return [
    { id: 'view', label: 'view', icon: 'pi pi-eye', variant: 'ghost', onClick: () => undefined },
    { id: 'edit', label: 'edit', icon: 'pi pi-pencil', variant: 'ghost', onClick: () => undefined },
    { id: 'run-now', label: 'serviceManagement.action.runNow', icon: 'pi pi-play', variant: 'ghost', onClick: () => undefined },
    {
      id: 'pause',
      label: 'serviceManagement.action.pause',
      icon: 'pi pi-pause',
      variant: 'ghost',
      visible: (row) => row.status !== 'paused',
      onClick: () => undefined,
    },
    {
      id: 'resume',
      label: 'serviceManagement.action.resume',
      icon: 'pi pi-forward',
      variant: 'ghost',
      visible: (row) => row.status === 'paused',
      onClick: () => undefined,
    },
  ];
}

function buildSecretFormConfig(): FormConfig {
  return {
    title: 'serviceManagement.form.secretTitle',
    description: 'serviceManagement.form.secretDescription',
    layout: {
      mode: 'sectioned',
      sectionNavigation: 'sidebar',
      stickyFooter: true,
      showValidationSummary: true,
    },
    sections: [
      { id: 'general', title: 'serviceManagement.form.section.general', icon: 'pi pi-info-circle' },
      { id: 'secret', title: 'serviceManagement.form.section.secret', icon: 'pi pi-lock' },
      { id: 'metadata', title: 'serviceManagement.form.section.metadata', icon: 'pi pi-tags', collapsible: true },
    ],
    fields: [
      textField('name', 'serviceManagement.field.name', 'general', true),
      textField('key', 'serviceManagement.field.key', 'general', true),
      selectField('environment', 'serviceManagement.field.environment', 'general', ENVIRONMENT_OPTIONS, true),
      selectField('status', 'serviceManagement.field.status', 'general', RESOURCE_STATUS_OPTIONS, true),
      textField('owner', 'serviceManagement.field.owner', 'general', true),
      {
        name: 'description',
        label: 'serviceManagement.field.description',
        type: 'textarea',
        sectionId: 'general',
        rows: 3,
        placeholder: 'serviceManagement.form.descriptionPlaceholder',
      },
      selectField(
        'type',
        'serviceManagement.field.type',
        'secret',
        [
          { label: 'serviceManagement.secretType.apiKey', value: 'api-key' },
          { label: 'serviceManagement.secretType.oauth', value: 'oauth' },
          { label: 'serviceManagement.secretType.basicAuth', value: 'basic-auth' },
          { label: 'serviceManagement.secretType.raw', value: 'raw' },
        ],
        true,
      ),
      {
        name: 'secretValue',
        label: 'serviceManagement.field.secretValue',
        type: 'textarea',
        sectionId: 'secret',
        rows: 4,
        placeholder: 'serviceManagement.form.secretValuePlaceholder',
        required: true,
        validation: [{ type: 'required', message: 'shared.validation.required' }],
      },
      {
        name: 'payload',
        label: 'serviceManagement.field.payload',
        type: 'json',
        sectionId: 'metadata',
        placeholder: '{}',
        contentType: 'json',
        showZoomButton: true,
      },
      {
        name: 'tags',
        label: 'serviceManagement.field.tags',
        type: 'input-multi',
        sectionId: 'metadata',
        placeholder: 'serviceManagement.form.tagsPlaceholder',
      },
    ],
  };
}

function buildConfigFormConfig(): FormConfig {
  return {
    title: 'serviceManagement.form.configTitle',
    description: 'serviceManagement.form.configDescription',
    layout: {
      mode: 'sectioned',
      sectionNavigation: 'sidebar',
      stickyFooter: true,
      showValidationSummary: true,
    },
    sections: [
      { id: 'general', title: 'serviceManagement.form.section.general', icon: 'pi pi-info-circle' },
      { id: 'runtime', title: 'serviceManagement.form.section.runtime', icon: 'pi pi-server' },
      { id: 'payload', title: 'serviceManagement.form.section.payload', icon: 'pi pi-code', collapsible: true },
    ],
    fields: [
      textField('name', 'serviceManagement.field.name', 'general', true),
      textField('key', 'serviceManagement.field.key', 'general', true),
      selectField('environment', 'serviceManagement.field.environment', 'general', ENVIRONMENT_OPTIONS, true),
      selectField('status', 'serviceManagement.field.status', 'general', RESOURCE_STATUS_OPTIONS, true),
      textField('owner', 'serviceManagement.field.owner', 'general', true),
      {
        name: 'description',
        label: 'serviceManagement.field.description',
        type: 'textarea',
        sectionId: 'general',
        rows: 3,
        placeholder: 'serviceManagement.form.descriptionPlaceholder',
      },
      selectField(
        'type',
        'serviceManagement.field.type',
        'runtime',
        [
          { label: 'serviceManagement.configType.json', value: 'json' },
          { label: 'serviceManagement.configType.yaml', value: 'yaml' },
          { label: 'serviceManagement.configType.properties', value: 'properties' },
        ],
        true,
      ),
      textField('endpoint', 'serviceManagement.field.endpoint', 'runtime', false),
      numberField('timeoutMs', 'serviceManagement.field.timeoutMs', 'runtime'),
      numberField('retryCount', 'serviceManagement.field.retryCount', 'runtime'),
      {
        name: 'payload',
        label: 'serviceManagement.field.payload',
        type: 'json',
        sectionId: 'payload',
        placeholder: '{}',
        contentType: 'json',
        showZoomButton: true,
      },
      {
        name: 'tags',
        label: 'serviceManagement.field.tags',
        type: 'input-multi',
        sectionId: 'payload',
        placeholder: 'serviceManagement.form.tagsPlaceholder',
      },
    ],
  };
}

function buildJobCrudConfig(mode: ServiceFormMode): BaseCrudPageConfig {
  const title = mode === 'create' ? 'serviceManagement.jobManagement.createTitle' : 'serviceManagement.jobManagement.editTitle';

  return {
    title,
    description: 'serviceManagement.jobManagement.formDescription',
    infoSection: {
      title: 'serviceManagement.jobManagement.formOwnerTitle',
      description: 'serviceManagement.jobManagement.formOwnerDescription',
    },
    actions: buildFormActions(),
    form: buildJobFormConfig(),
  };
}

function buildJobFormConfig(): FormConfig {
  return {
    title: 'serviceManagement.jobManagement.formTitle',
    description: 'serviceManagement.jobManagement.formDescription',
    layout: {
      mode: 'sectioned',
      sectionNavigation: 'sidebar',
      stickyFooter: true,
      showValidationSummary: true,
    },
    sections: [
      { id: 'general', title: 'serviceManagement.form.section.general', icon: 'pi pi-info-circle' },
      { id: 'schedule', title: 'serviceManagement.form.section.schedule', icon: 'pi pi-calendar-clock' },
      { id: 'execution', title: 'serviceManagement.form.section.execution', icon: 'pi pi-play-circle' },
    ],
    fields: [
      textField('name', 'serviceManagement.field.name', 'general', true),
      {
        name: 'description',
        label: 'serviceManagement.field.description',
        type: 'textarea',
        sectionId: 'general',
        rows: 3,
        placeholder: 'serviceManagement.form.descriptionPlaceholder',
      },
      selectField('environment', 'serviceManagement.field.environment', 'general', ENVIRONMENT_OPTIONS, true),
      selectField('status', 'serviceManagement.field.status', 'general', JOB_STATUS_OPTIONS, true),
      textField('owner', 'serviceManagement.field.owner', 'general', true),
      { name: 'enabled', label: 'serviceManagement.field.enabled', type: 'boolean', sectionId: 'general' },
      textField('schedule', 'serviceManagement.field.schedule', 'schedule', true),
      textField('timezone', 'serviceManagement.field.timezone', 'schedule', true),
      numberField('timeoutMs', 'serviceManagement.field.timeoutMs', 'schedule'),
      numberField('retryCount', 'serviceManagement.field.retryCount', 'schedule'),
      textField('handler', 'serviceManagement.field.handler', 'execution', true),
      textField('configRef', 'serviceManagement.field.configRef', 'execution', true),
      textField('secretRef', 'serviceManagement.field.secretRef', 'execution', false),
      {
        name: 'payload',
        label: 'serviceManagement.field.payload',
        type: 'json',
        sectionId: 'execution',
        placeholder: '{}',
        contentType: 'json',
        showZoomButton: true,
      },
    ],
  };
}

function textField(name: string, label: string, sectionId: string, required: boolean) {
  return {
    name,
    label,
    type: 'text' as const,
    sectionId,
    required,
    validation: required ? [{ type: 'required' as const, message: 'shared.validation.required' }] : undefined,
  };
}

function selectField(
  name: string,
  label: string,
  sectionId: string,
  options: Array<{ label: string; value: string | number | boolean | null }>,
  required: boolean,
) {
  return {
    name,
    label,
    type: 'select' as const,
    sectionId,
    options,
    required,
    showClear: !required,
    validation: required ? [{ type: 'required' as const, message: 'shared.validation.required' }] : undefined,
  };
}

function numberField(name: string, label: string, sectionId: string) {
  return {
    name,
    label,
    type: 'number' as const,
    sectionId,
  };
}

function defaultResourceModel(serviceId: ManagedServiceId, resourceKind: ServiceResourceKind): Record<string, unknown> {
  return {
    serviceId,
    kind: resourceKind,
    environment: 'dev',
    status: 'draft',
    owner: '',
    type: resourceKind === 'secret' ? 'api-key' : 'json',
    retryCount: resourceKind === 'config' ? 1 : undefined,
    timeoutMs: resourceKind === 'config' ? 10000 : undefined,
    payload: {},
    tags: [],
  };
}

function resourceToFormModel(record: ServiceResourceRecord): Record<string, unknown> {
  return {
    ...record,
    secretValue: record.maskedValue ?? '',
  };
}

function defaultJobModel(): Record<string, unknown> {
  return {
    environment: 'dev',
    status: 'idle',
    enabled: true,
    timezone: 'Asia/Bangkok',
    retryCount: 1,
    timeoutMs: 60000,
    payload: {},
  };
}

function jobToFormModel(job: JobRecord): Record<string, unknown> {
  return {
    ...job,
    timeoutMs: Math.max(job.durationMs * 2, 60000),
  };
}

function buildJobMetrics(jobs: readonly JobRecord[]): ServiceMetric[] {
  const running = jobs.filter((job) => job.status === 'running').length;
  const failed = jobs.filter((job) => job.status === 'failed').length;
  const paused = jobs.filter((job) => job.status === 'paused').length;
  const avgSuccess = jobs.length
    ? jobs.reduce((sum, job) => sum + job.successRate, 0) / jobs.length
    : 0;

  return [
    { label: 'serviceManagement.jobManagement.metric.total', value: jobs.length },
    { label: 'serviceManagement.jobManagement.metric.running', value: running, trend: '+1', trendVariant: 'success' },
    { label: 'serviceManagement.jobManagement.metric.failed', value: failed, trend: paused ? `${paused} paused` : undefined, trendVariant: failed ? 'danger' : 'muted' },
    { label: 'serviceManagement.jobManagement.metric.successRate', value: `${avgSuccess.toFixed(1)}%`, trend: '24h', trendVariant: 'info' },
  ];
}

function environmentVariant(environment: ServiceEnvironment) {
  switch (environment) {
    case 'prod':
      return 'info';
    case 'staging':
      return 'warning';
    case 'dev':
    default:
      return 'muted';
  }
}

function resourceStatusVariant(status: ServiceResourceStatus) {
  switch (status) {
    case 'active':
      return 'success';
    case 'rotating':
      return 'warning';
    case 'draft':
      return 'info';
    case 'inactive':
    default:
      return 'muted';
  }
}

function jobStatusVariant(status: JobStatus) {
  switch (status) {
    case 'running':
      return 'success';
    case 'paused':
      return 'warning';
    case 'failed':
      return 'danger';
    case 'idle':
    default:
      return 'muted';
  }
}

function normalizedText(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}
