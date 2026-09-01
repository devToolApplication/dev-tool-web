import { Routes } from '@angular/router';
import { permissionGuard } from '@core/auth/permission.guard';
import { SdkTaskConsoleComponent } from './pages/sdk-task-console/sdk-task-console.component';

export const systemManagementRoutes: Routes = [
  {
    path: 'admin/system-management/ai-agent-execution',
    component: SdkTaskConsoleComponent,
    canActivate: [permissionGuard],
    data: {
      permissions: ['AI_AGENT_EXECUTE'],
    },
  },
];
