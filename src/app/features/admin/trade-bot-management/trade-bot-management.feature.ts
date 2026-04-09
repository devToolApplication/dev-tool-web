import { Routes } from '@angular/router';
import { BacktestDetailComponent } from './backtest/detail/backtest-detail.component';
import { BacktestListComponent } from './backtest/list/backtest-list.component';
import { BacktestPerformanceChartComponent } from './backtest/performance-chart/backtest-performance-chart.component';
import { BacktestRunComponent } from './backtest/run/backtest-run.component';
import { TradeBotChartViewComponent } from './data-source/chart/view/trade-bot-chart-view.component';
import { ReplayAutoPausePanelComponent } from './strategy-binding/replay/components/replay-auto-pause-panel/replay-auto-pause-panel.component';
import { ReplayEventLogPanelComponent } from './strategy-binding/replay/components/replay-event-log-panel/replay-event-log-panel.component';
import { ReplayStepExplanationPanelComponent } from './strategy-binding/replay/components/replay-step-explanation-panel/replay-step-explanation-panel.component';
import { ReplayTradeTimelinePanelComponent } from './strategy-binding/replay/components/replay-trade-timeline-panel/replay-trade-timeline-panel.component';
import { StrategyBacktestPageComponent } from './strategy-binding/pages/strategy-backtest-page/strategy-backtest-page.component';
import { StrategyCreateEntryComponent } from './strategy-binding/pages/strategy-create-entry/strategy-create-entry.component';
import { StrategyFormPageComponent } from './strategy-binding/pages/strategy-form-page/strategy-form-page.component';
import { StrategyGeneralInfoSectionComponent } from './strategy-binding/shared/components/strategy-general-info-section.component';
import { StrategyRiskRewardSectionComponent } from './strategy-binding/shared/components/strategy-risk-reward-section.component';
import { StrategySpecificConfigSectionComponent } from './strategy-binding/shared/components/strategy-specific-config-section.component';
import { StrategyTypePickerPopupComponent } from './strategy-binding/shared/components/strategy-type-picker-popup.component';
import { STRATEGY_UI_REGISTRY } from './strategy-binding/shared/strategy-ui.registry';
import { StrategyConfigFormComponent } from './strategy-config/form/strategy-config-form.component';
import { StrategyConfigListComponent } from './strategy-config/list/strategy-config-list.component';
import { TradeStrategyBindingFormComponent } from './strategy-binding/form/trade-strategy-binding-form.component';
import { TradeStrategyBindingListComponent } from './strategy-binding/list/trade-strategy-binding-list.component';
import { StrategyRuleFormComponent } from './rule-config/form/strategy-rule-form.component';
import { StrategyRuleListComponent } from './rule-config/list/strategy-rule-list.component';
import { StrategyRuleTestComponent } from './rule-config/test/strategy-rule-test.component';
import { SyncConfigFormComponent } from './data-source/form/sync-config-form.component';
import { SyncConfigListComponent } from './data-source/list/sync-config-list.component';

const strategyCreateRoutes: Routes = STRATEGY_UI_REGISTRY.map((item) => ({
  path: `create/${item.routePath}`,
  component: StrategyFormPageComponent,
  data: { strategyServiceName: item.serviceName }
}));

export const TRADE_BOT_FEATURE_COMPONENTS = [
  SyncConfigListComponent,
  SyncConfigFormComponent,
  TradeBotChartViewComponent,
  StrategyConfigListComponent,
  StrategyConfigFormComponent,
  StrategyRuleListComponent,
  StrategyRuleFormComponent,
  StrategyRuleTestComponent,
  TradeStrategyBindingListComponent,
  TradeStrategyBindingFormComponent,
  BacktestListComponent,
  BacktestRunComponent,
  BacktestDetailComponent,
  BacktestPerformanceChartComponent,
  StrategyCreateEntryComponent,
  StrategyFormPageComponent,
  StrategyBacktestPageComponent,
  StrategyGeneralInfoSectionComponent,
  StrategySpecificConfigSectionComponent,
  StrategyRiskRewardSectionComponent,
  StrategyTypePickerPopupComponent,
  ReplayStepExplanationPanelComponent,
  ReplayTradeTimelinePanelComponent,
  ReplayEventLogPanelComponent,
  ReplayAutoPausePanelComponent
];

export const tradeBotRoutes: Routes = [
  { path: 'admin/trade-bot', redirectTo: 'admin/trade-bot/strategy-binding', pathMatch: 'full' },
  {
    path: 'admin/trade-bot/data-source',
    children: [
      { path: '', component: SyncConfigListComponent },
      { path: 'create', component: SyncConfigFormComponent },
      { path: 'edit/:id', component: SyncConfigFormComponent },
      { path: ':id/chart', component: TradeBotChartViewComponent }
    ]
  },
  {
    path: 'admin/trade-bot/strategy-configs',
    children: [
      { path: '', component: StrategyConfigListComponent },
      { path: 'create', component: StrategyConfigFormComponent },
      { path: ':id/edit', component: StrategyConfigFormComponent }
    ]
  },
  {
    path: 'admin/trade-bot/rule-configs',
    children: [
      { path: '', component: StrategyRuleListComponent },
      { path: 'create', component: StrategyRuleFormComponent },
      { path: ':id/edit', component: StrategyRuleFormComponent },
      { path: ':id/test', component: StrategyRuleTestComponent }
    ]
  },
  {
    path: 'admin/trade-bot/strategy-binding',
    children: [
      { path: '', component: TradeStrategyBindingListComponent },
      { path: 'create', component: StrategyCreateEntryComponent },
      ...strategyCreateRoutes,
      { path: ':id/edit', component: StrategyFormPageComponent },
      { path: ':id/backtest', component: StrategyBacktestPageComponent }
    ]
  },
  { path: 'admin/trade-bot/strategies', redirectTo: 'admin/trade-bot/strategy-binding', pathMatch: 'full' },
  { path: 'admin/trade-bot/strategies/create', redirectTo: 'admin/trade-bot/strategy-binding/create', pathMatch: 'full' },
  { path: 'admin/trade-bot/strategies/create/:routePath', redirectTo: 'admin/trade-bot/strategy-binding/create/:routePath', pathMatch: 'full' },
  { path: 'admin/trade-bot/strategies/:id/edit', redirectTo: 'admin/trade-bot/strategy-binding/:id/edit', pathMatch: 'full' },
  { path: 'admin/trade-bot/strategies/:id/backtest', redirectTo: 'admin/trade-bot/strategy-binding/:id/backtest', pathMatch: 'full' },
  {
    path: 'admin/trade-bot/backtests',
    children: [
      { path: '', component: BacktestListComponent },
      { path: 'run', component: BacktestRunComponent },
      { path: ':id', component: BacktestDetailComponent }
    ]
  }
];
