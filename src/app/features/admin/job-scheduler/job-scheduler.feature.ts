import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../../shared/ui/form-input/unsaved-changes.guard';
import { permissionGuard } from '../../../core/auth/permission.guard';
import { JobConfigFormComponent } from './form/job-config-form.component';
import { JobConfigListComponent } from './list/job-config-list.component';
import { JobRunListComponent } from './runs/job-run-list.component';

export const JOB_SCHEDULER_FEATURE_COMPONENTS = [
  JobConfigListComponent,
  JobConfigFormComponent,
  JobRunListComponent
];

export const jobSchedulerRoutes: Routes = [
  {
    path: 'admin/jobs',
    children: [
      { path: '', component: JobConfigListComponent },
      { path: 'create', component: JobConfigFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:code', component: JobConfigFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: ':code/runs', component: JobRunListComponent }
    ],
    canActivate: [permissionGuard],
    data: { permissions: ['JOB_SCHEDULER_READ'] }
  }
];
