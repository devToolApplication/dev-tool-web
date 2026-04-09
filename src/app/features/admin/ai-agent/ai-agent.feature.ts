import { Routes } from '@angular/router';
import { AiModelFormComponent } from './ai-model/form/ai-model-form.component';
import { AiModelListComponent } from './ai-model/list/ai-model-list.component';

export const AI_AGENT_FEATURE_COMPONENTS = [AiModelListComponent, AiModelFormComponent];

export const aiAgentAdminRoutes: Routes = [
  {
    path: 'admin/ai-agent/models',
    children: [
      { path: '', component: AiModelListComponent },
      { path: 'create', component: AiModelFormComponent },
      { path: 'edit/:id', component: AiModelFormComponent }
    ]
  },
  {
    path: 'admin/ai-agent/system-ask',
    redirectTo: 'admin/system-management/system-ask',
    pathMatch: 'full'
  },
  {
    path: 'admin/system-management/ai-models',
    redirectTo: 'admin/ai-agent/models',
    pathMatch: 'full'
  }
];
