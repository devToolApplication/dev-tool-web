import { systemManagementRoutes } from './system-management.routes';
import { SdkManagementComponent } from './pages/sdk-management/sdk-management.component';
import { SdkTaskConsoleComponent } from './pages/sdk-task-console/sdk-task-console.component';

describe('systemManagementRoutes', () => {
  it('registers sdk management route', () => {
    const route = systemManagementRoutes.find(
      (r) => r.path === 'admin/system-management/sdk',
    );
    expect(route).toBeDefined();
    expect(route?.component).toBe(SdkManagementComponent);
  });

  it('registers ai-agent-execution console route for backward compatibility', () => {
    const route = systemManagementRoutes.find(
      (r) => r.path === 'admin/system-management/ai-agent-execution',
    );
    expect(route).toBeDefined();
    expect(route?.component).toBe(SdkTaskConsoleComponent);
  });
});