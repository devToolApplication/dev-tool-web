import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { FieldsetModule } from 'primeng/fieldset';
import { FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { PanelModule } from 'primeng/panel';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TextareaModule } from 'primeng/textarea';
import { TimelineModule } from 'primeng/timeline';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToolbarModule } from 'primeng/toolbar';

import { SharedModule } from '../shared/shared.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardChartComponent } from './dashboard/components/dashboard-chart/dashboard-chart.component';
import { AiAgentDashboardComponent } from './dashboard/components/ai-agent-dashboard/ai-agent-dashboard.component';
import { FileStorageDashboardComponent } from './dashboard/components/file-storage-dashboard/file-storage-dashboard.component';
import { DemoComponent } from './demo/demo.component';
import { ForbiddenComponent } from './error/forbidden/forbidden.component';
import { NotFoundComponent } from './error/not-found/not-found.component';
import { FeaturePlaceholderComponent } from './feature-placeholder/feature-placeholder.component';
import { SettingsComponent } from './settings/settings.component';
import { AI_AGENT_FEATURE_COMPONENTS, aiAgentAdminRoutes } from './admin/ai-agent/ai-agent.feature';
import {
  CODEX_AGENT_FEATURE_COMPONENTS,
  codexAgentAdminRoutes
} from './admin/codex-agent/codex-agent.feature';
import {
  FILE_STORAGE_FEATURE_COMPONENTS,
  fileStorageRoutes
} from './admin/file-storage-management/file-storage-management.feature';
import {
  JOB_SCHEDULER_FEATURE_COMPONENTS,
  jobSchedulerRoutes
} from './admin/job-scheduler/job-scheduler.feature';
import {
  SYSTEM_MANAGEMENT_FEATURE_COMPONENTS,
  systemManagementRoutes
} from './admin/system-management/system-management.feature';
import {
  TRADE_BOT_FEATURE_COMPONENTS,
  tradeBotRoutes
} from './admin/trade-bot-management/trade-bot-management.feature';
import { DATA_FORM_FEATURE_COMPONENTS, dataFormRoutes } from './admin/data-form/data-form.feature';
import { CandleChart } from './admin/trade-bot-management/shared-trading/candle-chart/candle-chart';
import { DataQualityWarningComponent } from './admin/trade-bot-management/shared-trading/data-quality-warning/data-quality-warning.component';
import { RuleTreeViewerComponent } from './admin/trade-bot-management/shared-trading/rule-tree-viewer/rule-tree-viewer.component';
import { TradeDetailDrawerComponent } from './admin/trade-bot-management/shared-trading/trade-detail-drawer/trade-detail-drawer.component';
import { FEATURE_FORM_INPUT_OPTIONS_LOADERS } from './form-input-options-loaders';
import { dashboardRoutes } from './dashboard/dashboard-routing.module';
import { demoRouter } from './demo/demo-routing.module';
import { errorRoutes } from './error/error-routing.module';
import { settingsRoutes } from './settings/settings-routing.module';

const FEATURE_ROUTES: Routes = [
  ...settingsRoutes,
  ...demoRouter,
  ...dashboardRoutes,
  ...aiAgentAdminRoutes,
  ...fileStorageRoutes,
  ...jobSchedulerRoutes,
  ...systemManagementRoutes,
  ...tradeBotRoutes,
  ...codexAgentAdminRoutes,
  ...dataFormRoutes,
  ...errorRoutes,
  { path: '', pathMatch: 'full', redirectTo: 'admin/dashboard' },
  { path: '**', redirectTo: '404' }
];

const FEATURE_COMPONENTS = [
  DemoComponent,
  SettingsComponent,
  DashboardComponent,
  DashboardChartComponent,
  AiAgentDashboardComponent,
  FileStorageDashboardComponent,
  ForbiddenComponent,
  NotFoundComponent,
  FeaturePlaceholderComponent,
  ...AI_AGENT_FEATURE_COMPONENTS,
  ...FILE_STORAGE_FEATURE_COMPONENTS,
  ...JOB_SCHEDULER_FEATURE_COMPONENTS,
  ...SYSTEM_MANAGEMENT_FEATURE_COMPONENTS,
  ...TRADE_BOT_FEATURE_COMPONENTS,
  ...CODEX_AGENT_FEATURE_COMPONENTS,
  ...DATA_FORM_FEATURE_COMPONENTS,
  CandleChart,
  DataQualityWarningComponent,
  RuleTreeViewerComponent,
  TradeDetailDrawerComponent
];

@NgModule({
  declarations: [...FEATURE_COMPONENTS],
  imports: [
    CommonModule,
    RouterModule.forChild(FEATURE_ROUTES),
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    AvatarModule,
    BadgeModule,
    ButtonModule,
    CheckboxModule,
    DatePickerModule,
    DialogModule,
    FieldsetModule,
    FileUploadModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    MultiSelectModule,
    PanelModule,
    SelectModule,
    SliderModule,
    TableModule,
    TabsModule,
    TextareaModule,
    TimelineModule,
    ToggleSwitchModule,
    ToolbarModule
  ],
  providers: [...FEATURE_FORM_INPUT_OPTIONS_LOADERS]
})
export class AppFeatureModule {}
