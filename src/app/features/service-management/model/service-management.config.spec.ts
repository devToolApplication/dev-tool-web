import {
  buildJobManagementScreen,
  buildServiceResourceFormScreen,
  buildServiceResourceListScreen,
  filterServiceResources,
  filterJobs,
} from './service-management.config';

describe('service management screen config', () => {
  it('builds table-first CRUD screens for AI Agent and Job Service resources', () => {
    const aiSecret = buildServiceResourceListScreen('ai-agent-mcrs', 'secret');
    const jobConfig = buildServiceResourceListScreen('job-service', 'config');

    expect(aiSecret.title).toBe('serviceManagement.aiAgent.secret.title');
    expect(aiSecret.actions.map((action) => action.id)).toContain('create');
    expect(aiSecret.table.columns.some((column) => column.type === 'actions')).toBe(true);
    expect(aiSecret.records.length).toBeGreaterThan(0);

    expect(jobConfig.title).toBe('serviceManagement.job.config.title');
    expect(jobConfig.filters.map((filter) => filter.key)).toEqual(
      expect.arrayContaining(['keyword', 'environment', 'status']),
    );
  });

  it('builds create/edit form screens with FormConfig owned by the feature', () => {
    const form = buildServiceResourceFormScreen(
      'job-service',
      'config',
      'edit',
      'job-config-runtime',
    );

    expect(form.title).toBe('serviceManagement.job.config.editTitle');
    expect(form.formConfig.sections?.length).toBeGreaterThan(1);
    expect(form.model).toMatchObject({ id: 'job-config-runtime' });
  });

  it('filters resources by keyword, environment and status', () => {
    const screen = buildServiceResourceListScreen('ai-agent-mcrs', 'secret');

    const filtered = filterServiceResources(screen.records, {
      keyword: 'openai',
      environment: 'prod',
      status: 'active',
    });

    expect(filtered.map((item) => item.id)).toEqual(['ai-secret-openai-prod']);
  });

  it('filters resources by owner when the advanced owner filter is used', () => {
    const screen = buildServiceResourceListScreen('ai-agent-mcrs', 'secret');

    const filtered = filterServiceResources(screen.records, {
      owner: 'IAM',
    });

    expect(filtered.map((item) => item.id)).toEqual(['ai-secret-keycloak-client']);
  });

  it('filters jobs by owner when the advanced owner filter is used', () => {
    const screen = buildJobManagementScreen();

    const filtered = filterJobs(screen.jobs, {
      owner: 'AI Platform',
    });

    expect(filtered.map((item) => item.id)).toEqual(['job-refresh-model-metrics']);
  });

  it('builds a job management screen with KPIs, job actions and formConfig', () => {
    const screen = buildJobManagementScreen();

    expect(screen.title).toBe('serviceManagement.jobManagement.title');
    expect(screen.metrics.map((metric) => metric.label)).toEqual(
      expect.arrayContaining([
        'serviceManagement.jobManagement.metric.total',
        'serviceManagement.jobManagement.metric.running',
      ]),
    );
    expect(screen.table.columns.some((column) => column.type === 'actions')).toBe(true);
    expect(screen.formConfig.sections?.length).toBeGreaterThan(1);
  });
});
