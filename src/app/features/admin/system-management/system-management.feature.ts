import { Routes } from '@angular/router';
import { AiAgentConfigFormComponent } from './general-config/ai-agent-system/form/ai-agent-config-form.component';
import { AiAgentConfigListComponent } from './general-config/ai-agent-system/list/ai-agent-config-list.component';
import { AiAgentAskComponent } from './general-config/playwright-cdp-test/ai-agent-ask.component';
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
  AiAgentAskComponent
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
    path: 'admin/system-management/trade-bot-secrets',
    children: [
      { path: '', component: TradeBotSecretListComponent },
      { path: 'create', component: TradeBotSecretFormComponent },
      { path: 'edit/:id', component: TradeBotSecretFormComponent }
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
    path: 'admin/system-management/system-ask',
    component: AiAgentAskComponent
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
