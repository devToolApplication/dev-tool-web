import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '@shared/shared.module';
import { ForbiddenComponent } from './error/pages/forbidden/forbidden.component';
import { NotFoundComponent } from './error/pages/not-found/not-found.component';
import { errorRoutes } from './error/error.routes';
import { ServiceManagementModule } from './service-management/service-management.module';
import { serviceManagementRoutes } from './service-management/service-management.routes';
import { WorkflowProcessModule } from './workflow-process/workflow-process.module';
import { workflowProcessRoutes } from './workflow-process/workflow-process.routes';
import { AccountManagementModule } from './account-management/account-management.module';
import { accountManagementRoutes } from './account-management/account-management.routes';

const FEATURE_ROUTES: Routes = [
  ...accountManagementRoutes,
  ...serviceManagementRoutes,
  ...workflowProcessRoutes,
  ...errorRoutes,
  { path: '', pathMatch: 'full', redirectTo: 'accounts' },
  { path: '**', redirectTo: '404' },
];

const FEATURE_COMPONENTS = [ForbiddenComponent, NotFoundComponent];

@NgModule({
  declarations: [...FEATURE_COMPONENTS],
  imports: [
    CommonModule,
    RouterModule.forChild(FEATURE_ROUTES),
    SharedModule,
    AccountManagementModule,
    ServiceManagementModule,
    WorkflowProcessModule,
  ],
})
export class AppFeatureModule {}
