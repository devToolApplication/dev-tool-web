import { Routes } from '@angular/router';
import { AiModelFormComponent } from './ai-model/form/ai-model-form.component';
import { AiModelListComponent } from './ai-model/list/ai-model-list.component';
import { AgentDefinitionFormComponent } from './agent-definition/form/agent-definition-form.component';
import { AgentDefinitionListComponent } from './agent-definition/list/agent-definition-list.component';
import { ExecutionPolicyFormComponent } from './execution-policy/form/execution-policy-form.component';
import { ExecutionPolicyListComponent } from './execution-policy/list/execution-policy-list.component';
import { ExecutionTraceListComponent } from './execution-trace/list/execution-trace-list.component';
import { AiAgentPlaygroundComponent } from './playground/ai-agent-playground.component';
import { PlaywrightSessionManagementComponent } from './playwright-session/playwright-session-management.component';
import { PromptTemplateFormComponent } from './prompt-template/form/prompt-template-form.component';
import { PromptTemplateListComponent } from './prompt-template/list/prompt-template-list.component';

export const AI_AGENT_FEATURE_COMPONENTS = [
  AiModelListComponent,
  AiModelFormComponent,
  AgentDefinitionListComponent,
  AgentDefinitionFormComponent,
  PromptTemplateListComponent,
  PromptTemplateFormComponent,
  ExecutionPolicyListComponent,
  ExecutionPolicyFormComponent,
  ExecutionTraceListComponent,
  AiAgentPlaygroundComponent,
  PlaywrightSessionManagementComponent
];

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
    path: 'admin/ai-agent/agents',
    children: [
      { path: '', component: AgentDefinitionListComponent },
      { path: 'create', component: AgentDefinitionFormComponent },
      { path: 'edit/:id', component: AgentDefinitionFormComponent }
    ]
  },
  {
    path: 'admin/ai-agent/prompt-templates',
    children: [
      { path: '', component: PromptTemplateListComponent },
      { path: 'create', component: PromptTemplateFormComponent },
      { path: 'edit/:id', component: PromptTemplateFormComponent }
    ]
  },
  {
    path: 'admin/ai-agent/execution-policies',
    children: [
      { path: '', component: ExecutionPolicyListComponent },
      { path: 'create', component: ExecutionPolicyFormComponent },
      { path: 'edit/:id', component: ExecutionPolicyFormComponent }
    ]
  },
  {
    path: 'admin/ai-agent/execution-traces',
    component: ExecutionTraceListComponent
  },
  {
    path: 'admin/ai-agent/playground',
    component: AiAgentPlaygroundComponent
  },
  {
    path: 'admin/ai-agent/playwright-sessions',
    component: PlaywrightSessionManagementComponent
  },
  {
    path: 'admin/ai-agent/system-ask',
    redirectTo: 'admin/ai-agent/playground',
    pathMatch: 'full'
  },
  {
    path: 'admin/system-management/ai-models',
    redirectTo: 'admin/ai-agent/models',
    pathMatch: 'full'
  }
];
