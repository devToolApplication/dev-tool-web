import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../../shared/ui/form-input/unsaved-changes.guard';
import { permissionGuard } from '../../../core/auth/permission.guard';
import { JobConfigFormComponent } from './form/job-config-form.component';
import { JobConfigListComponent } from './list/job-config-list.component';
import { JobRunListComponent } from './runs/job-run-list.component';
import { JobSecretFormComponent } from './secrets/form/job-secret-form.component';
import { JobSecretListComponent } from './secrets/list/job-secret-list.component';

export const JOB_SCHEDULER_FEATURE_COMPONENTS = [
  JobConfigListComponent,
  JobConfigFormComponent,
  JobRunListComponent,
  JobSecretListComponent,
  JobSecretFormComponent
];

export const jobSchedulerRoutes: Routes = [
  {
    path: 'admin/jobs',
    children: [
      { path: '', component: JobConfigListComponent },
      {
        path: 'create',
        component: JobConfigFormComponent,
        canActivate: [permissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permissions: ['JOB_SCHEDULER_WRITE'] }
      },
      {
        path: 'edit/:code',
        component: JobConfigFormComponent,
        canActivate: [permissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permissions: ['JOB_SCHEDULER_WRITE'] }
      },
      { path: 'secrets', redirectTo: '/admin/system/secrets?tab=jobs', pathMatch: 'full' },
      {
        path: 'secrets/create',
        component: JobSecretFormComponent,
        canActivate: [permissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permissions: ['JOB_SCHEDULER_WRITE'] }
      },
      {
        path: 'secrets/edit/:code',
        component: JobSecretFormComponent,
        canActivate: [permissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permissions: ['JOB_SCHEDULER_WRITE'] }
      },
      { path: ':code/runs', component: JobRunListComponent }
    ],
    canActivate: [permissionGuard],
    data: { permissions: ['JOB_SCHEDULER_READ'] }
  }
];
