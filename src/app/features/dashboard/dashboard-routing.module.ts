import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { permissionGuard } from '../../core/auth/permission.guard';

export const dashboardRoutes: Routes = [
  {
    path: 'admin/overview',
    component: DashboardComponent,
    canActivate: [permissionGuard],
    data: { permissions: ['ADMIN_OVERVIEW_READ'] }
  }
];
