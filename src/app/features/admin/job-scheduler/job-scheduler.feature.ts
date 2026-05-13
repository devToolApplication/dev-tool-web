import { Routes } from '@angular/router';
import { JobConfigFormComponent } from './form/job-config-form.component';
import { JobConfigListComponent } from './list/job-config-list.component';
import { JobRunListComponent } from './runs/job-run-list.component';

export const JOB_SCHEDULER_FEATURE_COMPONENTS = [
  JobConfigListComponent,
  JobConfigFormComponent,
  JobRunListComponent
];

const jobSchedulerChildren: Routes = [
  { path: '', component: JobConfigListComponent },
  { path: 'create', component: JobConfigFormComponent },
  { path: 'edit/:code', component: JobConfigFormComponent },
  { path: ':code/runs', component: JobRunListComponent }
];

export const jobSchedulerRoutes: Routes = [
  {
    path: 'admin/job-scheduler',
    children: jobSchedulerChildren
  },
  {
    path: 'admin/system-management/jobs',
    children: jobSchedulerChildren
  }
];
