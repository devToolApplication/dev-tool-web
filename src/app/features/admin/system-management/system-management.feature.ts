import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../../shared/ui/form-input/unsaved-changes.guard';
import { permissionGuard } from '../../../core/auth/permission.guard';
import { FileUploadDebugComponent } from './debug-tools/file-upload-debug/file-upload-debug.component';
import { TokenCacheDebugComponent } from './debug-tools/token-cache-debug/token-cache-debug.component';
import { AiAgentConfigFormComponent } from './general-config/ai-agent-system/form/ai-agent-config-form.component';
import { AiAgentConfigListComponent } from './general-config/ai-agent-system/list/ai-agent-config-list.component';

import { StorageConfigFormComponent } from './general-config/storage-system/form/storage-config-form.component';
import { StorageConfigListComponent } from './general-config/storage-system/list/storage-config-list.component';
import { TradeBotConfigFormComponent } from './general-config/trade-bot-system/form/trade-bot-config-form.component';
import { TradeBotConfigListComponent } from './general-config/trade-bot-system/list/trade-bot-config-list.component';
import { AiAgentSecretFormComponent } from './secret-management/ai-agent-system/form/ai-agent-secret-form.component';
import { AiAgentSecretListComponent } from './secret-management/ai-agent-system/list/ai-agent-secret-list.component';
import { StorageSecretFormComponent } from './secret-management/storage-system/form/storage-secret-form.component';
import { StorageSecretListComponent } from './secret-management/storage-system/list/storage-secret-list.component';
import { TradeBotSecretFormComponent } from './secret-management/trade-bot-system/form/trade-bot-secret-form.component';
import { TradeBotSecretListComponent } from './secret-management/trade-bot-system/list/trade-bot-secret-list.component';

import { AiAgentModelListComponent } from './ai-agent-model/list/ai-agent-model-list.component';
import { AiAgentModelFormComponent } from './ai-agent-model/form/ai-agent-model-form.component';
import { AiAgentCrawlerListComponent } from './ai-agent-crawler/list/ai-agent-crawler-list.component';
import { AiAgentCrawlerFormComponent } from './ai-agent-crawler/form/ai-agent-crawler-form.component';
import { AiAgentCatalogListComponent } from './ai-agent-catalog/list/ai-agent-catalog-list.component';
import { AiAgentCatalogFormComponent } from './ai-agent-catalog/form/ai-agent-catalog-form.component';
import { AiAgentAuthProfileListComponent } from './ai-agent-auth-profile/list/ai-agent-auth-profile-list.component';
import { AiAgentAuthProfileFormComponent } from './ai-agent-auth-profile/form/ai-agent-auth-profile-form.component';
import { AiAgentAccountListComponent } from './ai-agent-account/list/ai-agent-account-list.component';
import { AiAgentAccountFormComponent } from './ai-agent-account/form/ai-agent-account-form.component';

import { AiAgentWorkflowListComponent } from './ai-agent-workflow-builder/list/ai-agent-workflow-list.component';
import { AiAgentWorkflowCanvasComponent } from './ai-agent-workflow-builder/canvas/ai-agent-workflow-canvas.component';
import { AiAgentWorkflowConfigPanelComponent } from './ai-agent-workflow-builder/config-panel/ai-agent-workflow-config-panel.component';
import { AiAgentWorkflowMonitorListComponent } from './ai-agent-workflow-monitor/list/ai-agent-workflow-monitor-list.component';
import { AiAgentWorkflowMonitorDetailComponent } from './ai-agent-workflow-monitor/detail/ai-agent-workflow-monitor-detail.component';
import { AiAgentExecutionComponent } from './ai-agent-execution/ai-agent-execution.component';

export const SYSTEM_MANAGEMENT_FEATURE_COMPONENTS = [
  StorageSecretListComponent,
  StorageSecretFormComponent,
  StorageConfigListComponent,
  StorageConfigFormComponent,
  AiAgentSecretListComponent,
  AiAgentSecretFormComponent,
  TradeBotSecretListComponent,
  TradeBotSecretFormComponent,
  AiAgentConfigListComponent,
  AiAgentConfigFormComponent,
  TradeBotConfigListComponent,
  TradeBotConfigFormComponent,
  FileUploadDebugComponent,
  TokenCacheDebugComponent,
  AiAgentModelListComponent,
  AiAgentModelFormComponent,
  AiAgentCrawlerListComponent,
  AiAgentCrawlerFormComponent,
  AiAgentCatalogListComponent,
  AiAgentCatalogFormComponent,
  AiAgentAuthProfileListComponent,
  AiAgentAuthProfileFormComponent,
  AiAgentAccountListComponent,
  AiAgentAccountFormComponent,
  AiAgentWorkflowListComponent,
  AiAgentWorkflowCanvasComponent,
  AiAgentWorkflowConfigPanelComponent,
  AiAgentWorkflowMonitorListComponent,
  AiAgentWorkflowMonitorDetailComponent,
  AiAgentExecutionComponent
];

export const systemManagementRoutes: Routes = [
  // AI Agent routes
  {
    path: 'admin/ai-agent/execution',
    component: AiAgentExecutionComponent,
    canActivate: [permissionGuard],
    data: { permissions: ['AI_AGENT_EXECUTE'] }
  },
  {
    path: 'admin/ai-agent/models',
    children: [
      { path: '', component: AiAgentModelListComponent },
      { path: 'create', component: AiAgentModelFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:id', component: AiAgentModelFormComponent, canDeactivate: [unsavedChangesGuard] }
    ],
    canActivate: [permissionGuard],
    data: { permissions: ['AI_AGENT_READ'] }
  },
  {
    path: 'admin/ai-agent/auth-profiles',
    children: [
      { path: '', component: AiAgentAuthProfileListComponent },
      { path: 'create', component: AiAgentAuthProfileFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:id', component: AiAgentAuthProfileFormComponent, canDeactivate: [unsavedChangesGuard] }
    ],
    canActivate: [permissionGuard],
    data: { permissions: ['AI_AGENT_READ'] }
  },
  {
    path: 'admin/ai-agent/accounts',
    children: [
      { path: '', component: AiAgentAccountListComponent },
      { path: 'create', component: AiAgentAccountFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:id', component: AiAgentAccountFormComponent, canDeactivate: [unsavedChangesGuard] }
    ],
    canActivate: [permissionGuard],
    data: { permissions: ['AI_AGENT_READ'] }
  },
  {
    path: 'admin/ai-agent/workflows',
    children: [
      { path: '', component: AiAgentWorkflowListComponent },
      { path: 'canvas/:id', component: AiAgentWorkflowCanvasComponent }
    ],
    canActivate: [permissionGuard],
    data: { permissions: ['AI_AGENT_WORKFLOW_WRITE'] }
  },
  {
    path: 'admin/ai-agent/workflow-runs',
    children: [
      { path: '', component: AiAgentWorkflowMonitorListComponent },
      { path: 'detail/:id', component: AiAgentWorkflowMonitorDetailComponent }
    ],
    canActivate: [permissionGuard],
    data: { permissions: ['AI_AGENT_WORKFLOW_REVIEW'] }
  },
  {
    path: 'admin/ai-agent/crawlers',
    children: [
      { path: '', component: AiAgentCrawlerListComponent },
      { path: 'create', component: AiAgentCrawlerFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:id', component: AiAgentCrawlerFormComponent, canDeactivate: [unsavedChangesGuard] }
    ],
    canActivate: [permissionGuard],
    data: { permissions: ['AI_AGENT_READ'] }
  },
  {
    path: 'admin/ai-agent/agents',
    children: [
      { path: '', component: AiAgentCatalogListComponent },
      { path: 'create', component: AiAgentCatalogFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:id', component: AiAgentCatalogFormComponent, canDeactivate: [unsavedChangesGuard] }
    ],
    canActivate: [permissionGuard],
    data: { permissions: ['AI_AGENT_READ'] }
  },
  {
    path: 'admin/ai-agent/configs',
    children: [
      { path: '', component: AiAgentConfigListComponent },
      { path: 'create', component: AiAgentConfigFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:id', component: AiAgentConfigFormComponent, canDeactivate: [unsavedChangesGuard] }
    ],
    canActivate: [permissionGuard],
    data: { permissions: ['AI_AGENT_CONFIG_WRITE'] }
  },
  {
    path: 'admin/ai-agent/secrets',
    children: [
      { path: '', component: AiAgentSecretListComponent },
      { path: 'create', component: AiAgentSecretFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:id', component: AiAgentSecretFormComponent, canDeactivate: [unsavedChangesGuard] }
    ],
    canActivate: [permissionGuard],
    data: { permissions: ['AI_AGENT_SECRET_WRITE'] }
  },
  // File Storage config/secrets
  {
    path: 'admin/file-storage/configs',
    children: [
      { path: '', component: StorageConfigListComponent },
      { path: 'create', component: StorageConfigFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:id', component: StorageConfigFormComponent, canDeactivate: [unsavedChangesGuard] }
    ],
    canActivate: [permissionGuard],
    data: { permissions: ['FILE_STORAGE_CONFIG_WRITE'] }
  },
  {
    path: 'admin/file-storage/secrets',
    children: [
      { path: '', component: StorageSecretListComponent },
      { path: 'create', component: StorageSecretFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:id', component: StorageSecretFormComponent, canDeactivate: [unsavedChangesGuard] }
    ],
    canActivate: [permissionGuard],
    data: { permissions: ['FILE_STORAGE_SECRET_WRITE'] }
  },
  // Trade Bot config/secrets
  {
    path: 'admin/trade-bot/configs',
    children: [
      { path: '', component: TradeBotConfigListComponent },
      { path: 'create', component: TradeBotConfigFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:id', component: TradeBotConfigFormComponent, canDeactivate: [unsavedChangesGuard] }
    ],
    canActivate: [permissionGuard],
    data: { permissions: ['TRADE_BOT_CONFIG_WRITE'] }
  },
  {
    path: 'admin/trade-bot/secrets',
    children: [
      { path: '', component: TradeBotSecretListComponent },
      { path: 'create', component: TradeBotSecretFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:id', component: TradeBotSecretFormComponent, canDeactivate: [unsavedChangesGuard] }
    ],
    canActivate: [permissionGuard],
    data: { permissions: ['TRADE_BOT_SECRET_WRITE'] }
  },
  // Devtools
  {
    path: 'admin/devtools/file-upload',
    component: FileUploadDebugComponent,
    canActivate: [permissionGuard],
    data: { permissions: ['DEVTOOLS_OPERATE'] }
  },
  {
    path: 'admin/devtools/token-cache',
    component: TokenCacheDebugComponent,
    canActivate: [permissionGuard],
    data: { permissions: ['DEVTOOLS_OPERATE'] }
  }
];
