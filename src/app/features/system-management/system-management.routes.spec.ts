import { systemManagementRoutes } from './system-management.routes';
import { SdkTaskConsoleComponent } from './pages/sdk-task-console/sdk-task-console.component';

describe('systemManagementRoutes', () => {
  it('registers ai-agent-execution console route', () => {
    const route = systemManagementRoutes.find(
      (r) => r.path === 'admin/system-management/ai-agent-execution',
    );
    expect(route).toBeDefined();
    expect(route?.component).toBe(SdkTaskConsoleComponent);
  });
});
