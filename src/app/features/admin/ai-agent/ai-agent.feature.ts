import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../../shared/ui/form-input/unsaved-changes.guard';
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
      { path: '', component: AiModelListComponent, data: { title: 'aiAgent.aiModel.title', breadcrumb: 'aiAgent.aiModel.title' } },
      { path: 'create', component: AiModelFormComponent, canDeactivate: [unsavedChangesGuard], data: { title: 'aiAgent.aiModel.createTitle', breadcrumb: 'layout.route.create' } },
      { path: 'edit/:id', component: AiModelFormComponent, canDeactivate: [unsavedChangesGuard], data: { title: 'aiAgent.aiModel.editTitle', breadcrumb: 'layout.route.edit' } }
    ]
  },
  {
    path: 'admin/ai-agent/agents',
    children: [
      { path: '', component: AgentDefinitionListComponent, data: { title: 'aiAgent.agentDefinition.title', breadcrumb: 'aiAgent.agentDefinition.title' } },
      { path: 'create', component: AgentDefinitionFormComponent, canDeactivate: [unsavedChangesGuard], data: { title: 'aiAgent.agentDefinition.createTitle', breadcrumb: 'layout.route.create' } },
      { path: 'edit/:id', component: AgentDefinitionFormComponent, canDeactivate: [unsavedChangesGuard], data: { title: 'aiAgent.agentDefinition.editTitle', breadcrumb: 'layout.route.edit' } }
    ]
  },
  {
    path: 'admin/ai-agent/prompt-templates',
    children: [
      { path: '', component: PromptTemplateListComponent, data: { title: 'aiAgent.promptTemplate.title', breadcrumb: 'aiAgent.promptTemplate.title' } },
      { path: 'create', component: PromptTemplateFormComponent, canDeactivate: [unsavedChangesGuard], data: { title: 'aiAgent.promptTemplate.createTitle', breadcrumb: 'layout.route.create' } },
      { path: 'edit/:id', component: PromptTemplateFormComponent, canDeactivate: [unsavedChangesGuard], data: { title: 'aiAgent.promptTemplate.editTitle', breadcrumb: 'layout.route.edit' } }
    ]
  },
  {
    path: 'admin/ai-agent/execution-policies',
    children: [
      { path: '', component: ExecutionPolicyListComponent, data: { title: 'aiAgent.executionPolicy.title', breadcrumb: 'aiAgent.executionPolicy.title' } },
      { path: 'create', component: ExecutionPolicyFormComponent, canDeactivate: [unsavedChangesGuard], data: { title: 'aiAgent.executionPolicy.createTitle', breadcrumb: 'layout.route.create' } },
      { path: 'edit/:id', component: ExecutionPolicyFormComponent, canDeactivate: [unsavedChangesGuard], data: { title: 'aiAgent.executionPolicy.editTitle', breadcrumb: 'layout.route.edit' } }
    ]
  },
  {
    path: 'admin/ai-agent/execution-traces',
    component: ExecutionTraceListComponent,
    data: { title: 'aiAgent.executionTrace.title', breadcrumb: 'aiAgent.executionTrace.title' }
  },
  {
    path: 'admin/ai-agent/runtime/playground',
    component: AiAgentPlaygroundComponent,
    data: { title: 'aiAgent.playground.title', breadcrumb: 'aiAgent.playground.title' }
  },
  {
    path: 'admin/ai-agent/playground',
    redirectTo: 'admin/ai-agent/runtime/playground',
    pathMatch: 'full'
  },
  {
    path: 'admin/ai-agent/playwright-sessions',
    component: PlaywrightSessionManagementComponent,
    data: { title: 'aiAgent.playwrightSessions.title', breadcrumb: 'aiAgent.playwrightSessions.title' }
  },
  {
    path: 'admin/ai-agent/system-ask',
    redirectTo: 'admin/ai-agent/runtime/playground',
    pathMatch: 'full'
  },
  {
    path: 'admin/system-management/ai-models',
    redirectTo: 'admin/ai-agent/models',
    pathMatch: 'full'
  }
];
