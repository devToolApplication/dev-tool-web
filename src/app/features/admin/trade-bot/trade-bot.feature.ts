import { Routes } from '@angular/router';
import { BacktestDetailComponent } from './backtest/detail/backtest-detail.component';
import { BacktestListComponent } from './backtest/list/backtest-list.component';
import { BacktestPerformanceChartComponent } from './backtest/performance-chart/backtest-performance-chart.component';
import { BacktestRunComponent } from './backtest/run/backtest-run.component';
import { TradeBotChartViewComponent } from './chart/view/trade-bot-chart-view.component';
import { ReplayAutoPausePanelComponent } from './strategies/replay/components/replay-auto-pause-panel.component';
import { ReplayEventLogPanelComponent } from './strategies/replay/components/replay-event-log-panel.component';
import { ReplayStepExplanationPanelComponent } from './strategies/replay/components/replay-step-explanation-panel.component';
import { ReplayTradeTimelinePanelComponent } from './strategies/replay/components/replay-trade-timeline-panel.component';
import { StrategyBacktestPageComponent } from './strategies/pages/strategy-backtest-page.component';
import { StrategyCreateEntryComponent } from './strategies/pages/strategy-create-entry.component';
import { StrategyFormPageComponent } from './strategies/pages/strategy-form-page.component';
import { StrategyGeneralInfoSectionComponent } from './strategies/shared/components/strategy-general-info-section.component';
import { StrategyRiskRewardSectionComponent } from './strategies/shared/components/strategy-risk-reward-section.component';
import { StrategySpecificConfigSectionComponent } from './strategies/shared/components/strategy-specific-config-section.component';
import { StrategyTypePickerPopupComponent } from './strategies/shared/components/strategy-type-picker-popup.component';
import { STRATEGY_UI_REGISTRY } from './strategies/shared/strategy-ui.registry';
import { TradeStrategyBindingFormComponent } from './strategy-binding/form/trade-strategy-binding-form.component';
import { TradeStrategyBindingListComponent } from './strategy-binding/list/trade-strategy-binding-list.component';
import { SyncConfigFormComponent } from './sync-config/form/sync-config-form.component';
import { SyncConfigListComponent } from './sync-config/list/sync-config-list.component';

const strategyCreateRoutes: Routes = STRATEGY_UI_REGISTRY.map((item) => ({
  path: `create/${item.routePath}`,
  component: StrategyFormPageComponent,
  data: { strategyCode: item.code }
}));

export const TRADE_BOT_FEATURE_COMPONENTS = [
  SyncConfigListComponent,
  SyncConfigFormComponent,
  TradeBotChartViewComponent,
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
  { path: 'admin/trade-bot', redirectTo: 'admin/trade-bot/strategies', pathMatch: 'full' },
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
    path: 'admin/trade-bot/strategies',
    children: [
      { path: '', component: TradeStrategyBindingListComponent },
      { path: 'create', component: StrategyCreateEntryComponent },
      ...strategyCreateRoutes,
      { path: ':id/edit', component: StrategyFormPageComponent },
      { path: ':id/backtest', component: StrategyBacktestPageComponent }
    ]
  },
  { path: 'admin/trade-bot/strategy-binding', redirectTo: 'admin/trade-bot/strategies', pathMatch: 'full' },
  { path: 'admin/trade-bot/strategy-binding/create', redirectTo: 'admin/trade-bot/strategies/create', pathMatch: 'full' },
  { path: 'admin/trade-bot/strategy-binding/edit/:id', redirectTo: 'admin/trade-bot/strategies/:id/edit', pathMatch: 'full' },
  {
    path: 'admin/trade-bot/backtests',
    children: [
      { path: '', component: BacktestListComponent },
      { path: 'run', component: BacktestRunComponent },
      { path: ':id', component: BacktestDetailComponent }
    ]
  }
];
