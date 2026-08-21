import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '@shared/ui/patterns/form-input/unsaved-changes.guard';
import { JobFormComponent } from './pages/job-form/job-form.component';
import { JobManagementComponent } from './pages/job-management/job-management.component';
import { ServiceResourceFormComponent } from './pages/service-resource-form/service-resource-form.component';
import { ServiceResourceListComponent } from './pages/service-resource-list/service-resource-list.component';

export const serviceManagementRoutes: Routes = [
  {
    path: 'ai-agent-mcrs/secrets',
    component: ServiceResourceListComponent,
    data: { serviceId: 'ai-agent-mcrs', resourceKind: 'secret' },
  },
  {
    path: 'ai-agent-mcrs/secrets/create',
    component: ServiceResourceFormComponent,
    canDeactivate: [unsavedChangesGuard],
    data: { serviceId: 'ai-agent-mcrs', resourceKind: 'secret', mode: 'create' },
  },
  {
    path: 'ai-agent-mcrs/secrets/:id/edit',
    component: ServiceResourceFormComponent,
    canDeactivate: [unsavedChangesGuard],
    data: { serviceId: 'ai-agent-mcrs', resourceKind: 'secret', mode: 'edit' },
  },
  {
    path: 'ai-agent-mcrs/configs',
    component: ServiceResourceListComponent,
    data: { serviceId: 'ai-agent-mcrs', resourceKind: 'config' },
  },
  {
    path: 'ai-agent-mcrs/configs/create',
    component: ServiceResourceFormComponent,
    canDeactivate: [unsavedChangesGuard],
    data: { serviceId: 'ai-agent-mcrs', resourceKind: 'config', mode: 'create' },
  },
  {
    path: 'ai-agent-mcrs/configs/:id/edit',
    component: ServiceResourceFormComponent,
    canDeactivate: [unsavedChangesGuard],
    data: { serviceId: 'ai-agent-mcrs', resourceKind: 'config', mode: 'edit' },
  },
  {
    path: 'job-service/secrets',
    component: ServiceResourceListComponent,
    data: { serviceId: 'job-service', resourceKind: 'secret' },
  },
  {
    path: 'job-service/secrets/create',
    component: ServiceResourceFormComponent,
    canDeactivate: [unsavedChangesGuard],
    data: { serviceId: 'job-service', resourceKind: 'secret', mode: 'create' },
  },
  {
    path: 'job-service/secrets/:id/edit',
    component: ServiceResourceFormComponent,
    canDeactivate: [unsavedChangesGuard],
    data: { serviceId: 'job-service', resourceKind: 'secret', mode: 'edit' },
  },
  {
    path: 'job-service/configs',
    component: ServiceResourceListComponent,
    data: { serviceId: 'job-service', resourceKind: 'config' },
  },
  {
    path: 'job-service/configs/create',
    component: ServiceResourceFormComponent,
    canDeactivate: [unsavedChangesGuard],
    data: { serviceId: 'job-service', resourceKind: 'config', mode: 'create' },
  },
  {
    path: 'job-service/configs/:id/edit',
    component: ServiceResourceFormComponent,
    canDeactivate: [unsavedChangesGuard],
    data: { serviceId: 'job-service', resourceKind: 'config', mode: 'edit' },
  },
  {
    path: 'job-service/jobs',
    component: JobManagementComponent,
  },
  {
    path: 'job-service/jobs/create',
    component: JobFormComponent,
    canDeactivate: [unsavedChangesGuard],
    data: { mode: 'create' },
  },
  {
    path: 'job-service/jobs/:id/edit',
    component: JobFormComponent,
    canDeactivate: [unsavedChangesGuard],
    data: { mode: 'edit' },
  },
];
