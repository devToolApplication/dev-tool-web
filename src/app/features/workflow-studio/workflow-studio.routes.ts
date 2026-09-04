import { Routes } from '@angular/router';
import { serviceManagementUnsavedChangesGuard } from '@features/service-management/guards/service-management-unsaved-changes.guard';
import { WorkflowBuilderPageComponent } from './pages/workflow-builder-page.component';
import { WorkflowListPageComponent } from './pages/workflow-list-page.component';

export const workflowStudioRoutes: Routes = [
  {
    path: 'ai-agent-mcrs/workflows',
    component: WorkflowListPageComponent,
  },
  {
    path: 'ai-agent-mcrs/workflows/create',
    component: WorkflowBuilderPageComponent,
    canDeactivate: [serviceManagementUnsavedChangesGuard],
  },
  {
    path: 'ai-agent-mcrs/workflows/:workflowId/edit',
    component: WorkflowBuilderPageComponent,
    canDeactivate: [serviceManagementUnsavedChangesGuard],
  },
];
