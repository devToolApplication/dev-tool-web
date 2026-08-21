import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { JobFormComponent } from './pages/job-form/job-form.component';
import { JobManagementComponent } from './pages/job-management/job-management.component';
import { ServiceResourceFormComponent } from './pages/service-resource-form/service-resource-form.component';
import { ServiceResourceListComponent } from './pages/service-resource-list/service-resource-list.component';

const SERVICE_MANAGEMENT_COMPONENTS = [
  ServiceResourceListComponent,
  ServiceResourceFormComponent,
  JobManagementComponent,
  JobFormComponent,
];

@NgModule({
  declarations: SERVICE_MANAGEMENT_COMPONENTS,
  imports: [CommonModule, SharedModule],
})
export class ServiceManagementModule {}
