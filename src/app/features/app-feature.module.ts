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
import { AccountManagementModule } from './account-management/account-management.module';
import { accountManagementRoutes } from './account-management/account-management.routes';
import { CodexSdkModule } from './codex-sdk/codex-sdk.module';
import { codexSdkRoutes } from './codex-sdk/codex-sdk.routes';
import { KocCampaignModule } from './koc-campaign/koc-campaign.module';
import { kocCampaignRoutes } from './koc-campaign/koc-campaign.routes';
import { UserTaskModule } from './user-task/user-task.module';
import { userTaskRoutes } from './user-task/user-task.routes';

const FEATURE_ROUTES: Routes = [
  ...accountManagementRoutes,
  ...kocCampaignRoutes,
  ...serviceManagementRoutes,
  ...workflowStudioRoutes,
  ...codexSdkRoutes,
  ...userTaskRoutes,
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
    WorkflowStudioModule,
    CodexSdkModule,
    KocCampaignModule,
    UserTaskModule,
  ],
})
export class AppFeatureModule {}
