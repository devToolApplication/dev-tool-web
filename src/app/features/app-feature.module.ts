import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

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
import { CandleChart } from './admin/trade-bot-management/share/candle-chart/candle-chart';
import { CandleChartHeaderComponent } from './admin/trade-bot-management/share/candle-chart/components/candle-chart-header/candle-chart-header.component';
import { CandleChartReplayControlsComponent } from './admin/trade-bot-management/share/candle-chart/components/candle-chart-replay-controls/candle-chart-replay-controls.component';
import { CandleChartStateOverlayComponent } from './admin/trade-bot-management/share/candle-chart/components/candle-chart-state-overlay/candle-chart-state-overlay.component';
import { CandleChartToolbarComponent } from './admin/trade-bot-management/share/candle-chart/components/candle-chart-toolbar/candle-chart-toolbar.component';
import { DataQualityWarningComponent } from './admin/trade-bot-management/share/data-quality-warning/data-quality-warning.component';
import { RuleExpressionBuilderComponent } from './admin/trade-bot-management/share/rule-expression-builder/rule-expression-builder.component';
import { RuleConditionRowComponent } from './admin/trade-bot-management/share/rule-expression-builder/rule-condition-row.component';
import { RuleExpressionJsonPreviewComponent } from './admin/trade-bot-management/share/rule-expression-builder/rule-expression-json-preview.component';
import { RuleExpressionNodeComponent } from './admin/trade-bot-management/share/rule-expression-builder/rule-expression-node.component';
import { RuleExpressionOperandPickerComponent } from './admin/trade-bot-management/share/rule-expression-builder/rule-expression-operand-picker.component';
import { RuleExpressionPanelComponent } from './admin/trade-bot-management/share/rule-expression-builder/rule-expression-panel.component';
import { RuleTreeViewerComponent } from './admin/trade-bot-management/share/rule-tree-viewer/rule-tree-viewer.component';
import { RuleFlowEditorComponent } from './admin/trade-bot-management/share/rule-flow-editor/rule-flow-editor.component';
import { RuleFlowViewerComponent } from './admin/trade-bot-management/share/rule-flow-viewer/rule-flow-viewer.component';
import { TradeDetailDrawerComponent } from './admin/trade-bot-management/share/trade-detail-drawer/trade-detail-drawer.component';
import { FEATURE_FORM_INPUT_OPTIONS_LOADERS } from './form-input-options-loaders';
import { dashboardRoutes } from './dashboard/dashboard-routing.module';
import { demoRouter } from './demo/demo-routing.module';
import { errorRoutes } from './error/error-routing.module';
import { settingsRoutes } from './settings/settings-routing.module';

const FEATURE_ROUTES: Routes = [
  ...settingsRoutes,
  ...demoRouter,
  ...dashboardRoutes,
  ...fileStorageRoutes,
  ...jobSchedulerRoutes,
  ...systemManagementRoutes,
  ...tradeBotRoutes,
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
  ...FILE_STORAGE_FEATURE_COMPONENTS,
  ...JOB_SCHEDULER_FEATURE_COMPONENTS,
  ...SYSTEM_MANAGEMENT_FEATURE_COMPONENTS,
  ...TRADE_BOT_FEATURE_COMPONENTS,
  ...DATA_FORM_FEATURE_COMPONENTS,
  CandleChart,
  CandleChartHeaderComponent,
  CandleChartReplayControlsComponent,
  CandleChartStateOverlayComponent,
  CandleChartToolbarComponent,
  DataQualityWarningComponent,
  RuleExpressionBuilderComponent,
  RuleConditionRowComponent,
  RuleExpressionJsonPreviewComponent,
  RuleExpressionNodeComponent,
  RuleExpressionOperandPickerComponent,
  RuleExpressionPanelComponent,
  RuleTreeViewerComponent,
  RuleFlowEditorComponent,
  RuleFlowViewerComponent,
  TradeDetailDrawerComponent
];

@NgModule({
  declarations: [...FEATURE_COMPONENTS],
  imports: [
    CommonModule,
    RouterModule.forChild(FEATURE_ROUTES),
    SharedModule
  ],
  providers: [...FEATURE_FORM_INPUT_OPTIONS_LOADERS]
})
export class AppFeatureModule {}
