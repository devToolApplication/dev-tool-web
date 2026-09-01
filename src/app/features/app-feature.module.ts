import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '@shared/shared.module';
import { ForbiddenComponent } from './error/pages/forbidden/forbidden.component';
import { NotFoundComponent } from './error/pages/not-found/not-found.component';
import { errorRoutes } from './error/error.routes';
import { ServiceManagementModule } from './service-management/service-management.module';
import { serviceManagementRoutes } from './service-management/service-management.routes';
import { WorkflowStudioModule } from './workflow-studio/workflow-studio.module';
import { workflowStudioRoutes } from './workflow-studio/workflow-studio.routes';
import { KocManagementModule } from './koc-management/koc-management.module';
import { kocManagementRoutes } from './koc-management/koc-management.routes';
import { SystemManagementModule } from './system-management/system-management.module';
import { systemManagementRoutes } from './system-management/system-management.routes';

const FEATURE_ROUTES: Routes = [
  ...serviceManagementRoutes,
  ...workflowStudioRoutes,
  ...kocManagementRoutes,
  ...systemManagementRoutes,
  ...errorRoutes,
  { path: '', pathMatch: 'full', redirectTo: 'ai-agent-mcrs/secrets' },
  { path: '**', redirectTo: '404' },
];

const FEATURE_COMPONENTS = [ForbiddenComponent, NotFoundComponent];

@NgModule({
  declarations: [...FEATURE_COMPONENTS],
  imports: [
    CommonModule,
    RouterModule.forChild(FEATURE_ROUTES),
    SharedModule,
    ServiceManagementModule,
    WorkflowStudioModule,
    KocManagementModule,
    SystemManagementModule,
  ],
})
export class AppFeatureModule {}
