import { Routes } from '@angular/router';
import { CodexAgentLoginComponent } from './login/codex-agent-login.component';
import { CodexAgentPlaygroundComponent } from './playground/codex-agent-playground.component';
import { CodexSkillFormComponent } from './skills/form/codex-skill-form.component';
import { CodexSkillListComponent } from './skills/list/codex-skill-list.component';
import { CodexMcpServerManagementComponent } from './mcp-servers/codex-mcp-server-management.component';
import { CodexChatHistoryComponent } from './chat-history/codex-chat-history.component';
import { AgentDefinitionListComponent } from '../ai-agent/agent-definition/list/agent-definition-list.component';
import { AgentDefinitionFormComponent } from '../ai-agent/agent-definition/form/agent-definition-form.component';

export const CODEX_AGENT_FEATURE_COMPONENTS = [
  CodexAgentLoginComponent,
  CodexAgentPlaygroundComponent,
  CodexMcpServerManagementComponent,
  CodexChatHistoryComponent,
  CodexSkillListComponent,
  CodexSkillFormComponent
];

export const codexAgentAdminRoutes: Routes = [
  {
    path: 'admin/codex-agent/login',
    component: CodexAgentLoginComponent
  },
  {
    path: 'admin/codex-agent/mcp-servers',
    component: CodexMcpServerManagementComponent
  },
  {
    path: 'admin/codex-agent/playground',
    component: CodexAgentPlaygroundComponent
  },
  {
    path: 'admin/codex-agent/agents',
    children: [
      { path: '', component: AgentDefinitionListComponent, data: { managementContext: 'codex' } },
      { path: 'create', component: AgentDefinitionFormComponent, data: { managementContext: 'codex' } },
      { path: 'edit/:id', component: AgentDefinitionFormComponent, data: { managementContext: 'codex' } }
    ]
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
    path: 'admin/codex-agent/chat-history',
    component: CodexChatHistoryComponent
  },
  {
    path: 'admin/codex-agent',
    redirectTo: 'admin/codex-agent/chat-history',
    pathMatch: 'full'
  }
];
