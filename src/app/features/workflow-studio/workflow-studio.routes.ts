import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '@shared/ui/patterns/form-input/unsaved-changes.guard';
import { WorkflowBuilderPageComponent } from './pages/workflow-builder-page.component';
import { WorkflowListPageComponent } from './pages/workflow-list-page.component';
import { WorkflowRunDetailPageComponent } from './pages/workflow-run-detail-page.component';
import { WorkflowRunListPageComponent } from './pages/workflow-run-list-page.component';

export const workflowStudioRoutes: Routes = [
  {
    path: 'ai-agent-mcrs/workflows',
    component: WorkflowListPageComponent,
  },
  {
    path: 'ai-agent-mcrs/workflows/create',
    component: WorkflowBuilderPageComponent,
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'ai-agent-mcrs/workflows/:workflowId/edit',
    component: WorkflowBuilderPageComponent,
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'ai-agent-mcrs/workflow-runs',
    component: WorkflowRunListPageComponent,
  },
  {
    path: 'ai-agent-mcrs/workflow-runs/:runId',
    component: WorkflowRunDetailPageComponent,
  },
];
