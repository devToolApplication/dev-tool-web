import { Routes } from '@angular/router';
import { AiAgentConfigFormComponent } from './config/ai-agent/form/ai-agent-config-form.component';
import { AiAgentConfigListComponent } from './config/ai-agent/list/ai-agent-config-list.component';
import { StorageConfigFormComponent } from './config/storage/form/storage-config-form.component';
import { StorageConfigListComponent } from './config/storage/list/storage-config-list.component';
import { TradeBotConfigFormComponent } from './config/trade-bot/form/trade-bot-config-form.component';
import { TradeBotConfigListComponent } from './config/trade-bot/list/trade-bot-config-list.component';
import { AiAgentSecretFormComponent } from './secret/ai-agent/form/ai-agent-secret-form.component';
import { AiAgentSecretListComponent } from './secret/ai-agent/list/ai-agent-secret-list.component';
import { StorageSecretFormComponent } from './secret/storage/form/storage-secret-form.component';
import { StorageSecretListComponent } from './secret/storage/list/storage-secret-list.component';

export const SYSTEM_MANAGEMENT_FEATURE_COMPONENTS = [
  StorageSecretListComponent,
  StorageSecretFormComponent,
  StorageConfigListComponent,
  StorageConfigFormComponent,
  AiAgentSecretListComponent,
  AiAgentSecretFormComponent,
  AiAgentConfigListComponent,
  AiAgentConfigFormComponent,
  TradeBotConfigListComponent,
  TradeBotConfigFormComponent
];

export const systemManagementRoutes: Routes = [
  {
    path: 'admin/system-management/storage-secrets',
    children: [
      { path: '', component: StorageSecretListComponent },
      { path: 'create', component: StorageSecretFormComponent },
      { path: 'edit/:id', component: StorageSecretFormComponent }
    ]
  },
  {
    path: 'admin/system-management/storage-configs',
    children: [
      { path: '', component: StorageConfigListComponent },
      { path: 'create', component: StorageConfigFormComponent },
      { path: 'edit/:id', component: StorageConfigFormComponent }
    ]
  },
  {
    path: 'admin/system-management/ai-agent-secrets',
    children: [
      { path: '', component: AiAgentSecretListComponent },
      { path: 'create', component: AiAgentSecretFormComponent },
      { path: 'edit/:id', component: AiAgentSecretFormComponent }
    ]
  },
  {
    path: 'admin/system-management/ai-agent-configs',
    children: [
      { path: '', component: AiAgentConfigListComponent },
      { path: 'create', component: AiAgentConfigFormComponent },
      { path: 'edit/:id', component: AiAgentConfigFormComponent }
    ]
  },
  {
    path: 'admin/system-management/trade-bot-configs',
    children: [
      { path: '', component: TradeBotConfigListComponent },
      { path: 'create', component: TradeBotConfigFormComponent },
      { path: 'edit/:id', component: TradeBotConfigFormComponent }
    ]
  }
];
