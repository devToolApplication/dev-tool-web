import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../../shared/ui/form-input/unsaved-changes.guard';
import { FileUploadDebugComponent } from './debug-tools/file-upload-debug/file-upload-debug.component';
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
  FileUploadDebugComponent
];

export const systemManagementRoutes: Routes = [
  {
    path: 'admin/system-management/storage-secrets',
    children: [
      { path: '', component: StorageSecretListComponent },
      { path: 'create', component: StorageSecretFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:id', component: StorageSecretFormComponent, canDeactivate: [unsavedChangesGuard] }
    ]
  },
  {
    path: 'admin/system-management/storage-configs',
    children: [
      { path: '', component: StorageConfigListComponent },
      { path: 'create', component: StorageConfigFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:id', component: StorageConfigFormComponent, canDeactivate: [unsavedChangesGuard] }
    ]
  },
  {
    path: 'admin/system-management/ai-agent-secrets',
    children: [
      { path: '', component: AiAgentSecretListComponent },
      { path: 'create', component: AiAgentSecretFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:id', component: AiAgentSecretFormComponent, canDeactivate: [unsavedChangesGuard] }
    ]
  },
  {
    path: 'admin/system-management/trade-bot-secrets',
    children: [
      { path: '', component: TradeBotSecretListComponent },
      { path: 'create', component: TradeBotSecretFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:id', component: TradeBotSecretFormComponent, canDeactivate: [unsavedChangesGuard] }
    ]
  },
  {
    path: 'admin/system-management/ai-agent-configs',
    children: [
      { path: '', component: AiAgentConfigListComponent },
      { path: 'create', component: AiAgentConfigFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:id', component: AiAgentConfigFormComponent, canDeactivate: [unsavedChangesGuard] }
    ]
  },

  {
    path: 'admin/system-management/file-upload',
    component: FileUploadDebugComponent
  },
  {
    path: 'admin/system-management/trade-bot-configs',
    children: [
      { path: '', component: TradeBotConfigListComponent },
      { path: 'create', component: TradeBotConfigFormComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'edit/:id', component: TradeBotConfigFormComponent, canDeactivate: [unsavedChangesGuard] }
    ]
  }
];
