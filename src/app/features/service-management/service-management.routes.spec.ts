import { serviceManagementRoutes } from './service-management.routes';
import { serviceManagementUnsavedChangesGuard } from './guards/service-management-unsaved-changes.guard';

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

  it('keeps unsaved-change route policy in the service-management feature', () => {
    const guardedRoutes = serviceManagementRoutes.filter((route) => route.canDeactivate?.length);

    expect(guardedRoutes.length).toBeGreaterThan(0);
    expect(
      guardedRoutes.every(
        (route) => route.canDeactivate?.[0] === serviceManagementUnsavedChangesGuard,
      ),
    ).toBe(true);
  });
});
