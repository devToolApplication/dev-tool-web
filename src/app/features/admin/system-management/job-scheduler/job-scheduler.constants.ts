import {
  JobConfigFormModel,
  JobHttpMethod,
  JobRunStatus,
  JobTriggerType
} from '../../../../core/models/job-scheduler/job-scheduler.model';

export const JOB_SCHEDULER_ROUTES = {
  list: '/admin/system-management/jobs',
  create: '/admin/system-management/jobs/create'
} as const;

export const JOB_HTTP_METHOD_OPTIONS: { label: string; value: JobHttpMethod }[] = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'DELETE', value: 'DELETE' }
];

export const JOB_STATUS_OPTIONS: { label: string; value: JobRunStatus }[] = [
  { label: 'running', value: 'RUNNING' },
  { label: 'success', value: 'SUCCESS' },
  { label: 'failed', value: 'FAILED' },
  { label: 'skipped', value: 'SKIPPED' }
];

export const JOB_TRIGGER_TYPE_OPTIONS: { label: string; value: JobTriggerType }[] = [
  { label: 'scheduled', value: 'SCHEDULED' },
  { label: 'manual', value: 'MANUAL' }
];

export const JOB_CONFIG_INITIAL_VALUE: JobConfigFormModel = {
  code: '',
  name: '',
  description: '',
  cron: '*/5 * * * *',
  timezone: 'Asia/Ho_Chi_Minh',
  enabled: true,
  target: {
    method: 'POST',
    url: '',
    headers: {},
    body: '{}',
    timeoutMs: 30000
  },
  auth: {
    type: 'NONE',
    basic: {
      username: '',
      password: ''
    },
    apiKey: {
      headerName: 'x-api-key',
      value: ''
    },
    keycloak: {
      baseUrl: '',
      realm: '',
      clientId: '',
      clientSecret: '',
      scope: '',
      tokenField: 'access_token',
      headerName: 'Authorization',
      headerPrefix: 'Bearer'
    }
  },
  retry: {
    maxAttempts: 1
  }
};

