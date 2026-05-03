import { Routes } from '@angular/router';
import { CodexAgentFormComponent } from './agents/form/codex-agent-form.component';
import { CodexAgentListComponent } from './agents/list/codex-agent-list.component';

export const CODEX_AGENT_FEATURE_COMPONENTS = [CodexAgentListComponent, CodexAgentFormComponent];

export const codexAgentAdminRoutes: Routes = [
  {
    path: 'admin/codex-agent/agents',
    children: [
      { path: '', component: CodexAgentListComponent },
      { path: 'create', component: CodexAgentFormComponent },
      { path: 'edit/:id', component: CodexAgentFormComponent }
    ]
  },
  {
    path: 'admin/codex-agent',
    redirectTo: 'admin/codex-agent/agents',
    pathMatch: 'full'
  }
];
