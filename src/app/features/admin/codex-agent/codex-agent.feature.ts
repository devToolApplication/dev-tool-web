import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../../shared/ui/form-input/unsaved-changes.guard';
import { CodexAgentFormComponent } from './agents/form/codex-agent-form.component';
import { CodexAgentListComponent } from './agents/list/codex-agent-list.component';

export const CODEX_AGENT_FEATURE_COMPONENTS = [CodexAgentListComponent, CodexAgentFormComponent];

export const codexAgentAdminRoutes: Routes = [
  {
    path: 'admin/codex-agent/agents',
    children: [
      { path: '', component: CodexAgentListComponent },
      { path: 'create', component: CodexAgentFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:id', component: CodexAgentFormComponent, canDeactivate: [unsavedChangesGuard] }
    ]
  },
  {
    path: 'admin/codex-agent',
    redirectTo: 'admin/codex-agent/agents',
    pathMatch: 'full'
  }
];
