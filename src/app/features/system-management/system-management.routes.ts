import { Routes } from '@angular/router';
import { permissionGuard } from '@core/auth/permission.guard';
import { SdkManagementComponent } from './pages/sdk-management/sdk-management.component';
import { SdkTaskConsoleComponent } from './pages/sdk-task-console/sdk-task-console.component';

export const systemManagementRoutes: Routes = [
  {
    path: 'admin/system-management/sdk',
    component: SdkManagementComponent,
    canActivate: [permissionGuard],
    data: {
      permissions: ['AI_AGENT_EXECUTE'],
    },
  },
  {
    path: 'admin/system-management/ai-agent-execution',
    component: SdkTaskConsoleComponent,
    canActivate: [permissionGuard],
    data: {
      permissions: ['AI_AGENT_EXECUTE'],
    },
  },
];