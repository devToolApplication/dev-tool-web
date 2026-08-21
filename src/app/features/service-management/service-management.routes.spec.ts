import { serviceManagementRoutes } from './service-management.routes';

describe('serviceManagementRoutes', () => {
  it('registers CRUD routes for the two managed backend services', () => {
    expect(serviceManagementRoutes.map((route) => route.path)).toEqual(
      expect.arrayContaining([
        'ai-agent-mcrs/secrets',
        'ai-agent-mcrs/secrets/create',
        'ai-agent-mcrs/secrets/:id/edit',
        'ai-agent-mcrs/configs',
        'ai-agent-mcrs/configs/create',
        'ai-agent-mcrs/configs/:id/edit',
        'job-service/secrets',
        'job-service/secrets/create',
        'job-service/secrets/:id/edit',
        'job-service/configs',
        'job-service/configs/create',
        'job-service/configs/:id/edit',
        'job-service/jobs',
        'job-service/jobs/create',
        'job-service/jobs/:id/edit',
      ]),
    );
  });
});
