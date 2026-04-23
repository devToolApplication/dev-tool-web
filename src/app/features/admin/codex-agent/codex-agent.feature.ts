import { Routes } from '@angular/router';
import { CodexAgentLoginComponent } from './login/codex-agent-login.component';
import { CodexAgentPlaygroundComponent } from './playground/codex-agent-playground.component';
import { CodexSkillFormComponent } from './skills/form/codex-skill-form.component';
import { CodexSkillListComponent } from './skills/list/codex-skill-list.component';

export const CODEX_AGENT_FEATURE_COMPONENTS = [
  CodexAgentLoginComponent,
  CodexAgentPlaygroundComponent,
  CodexSkillListComponent,
  CodexSkillFormComponent
];

export const codexAgentAdminRoutes: Routes = [
  {
    path: 'admin/codex-agent/login',
    component: CodexAgentLoginComponent
  },
  {
    path: 'admin/codex-agent/playground',
    component: CodexAgentPlaygroundComponent
  },
  {
    path: 'admin/codex-agent/skills',
    children: [
      { path: '', component: CodexSkillListComponent },
      { path: 'create', component: CodexSkillFormComponent },
      { path: 'edit/:id', component: CodexSkillFormComponent }
    ]
  },
  {
    path: 'admin/codex-agent',
    redirectTo: 'admin/codex-agent/login',
    pathMatch: 'full'
  }
];
