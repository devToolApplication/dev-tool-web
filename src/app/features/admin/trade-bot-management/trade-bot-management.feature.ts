import { Routes } from '@angular/router';
import { BacktestDetailComponent } from './pages/backtest/detail/backtest-detail.component';
import { BacktestOverviewTabComponent } from './pages/backtest/detail/components/backtest-overview-tab/backtest-overview-tab.component';
import { BacktestChartTabComponent } from './pages/backtest/detail/components/backtest-chart-tab/backtest-chart-tab.component';
import { BacktestEquityTabComponent } from './pages/backtest/detail/components/backtest-equity-tab/backtest-equity-tab.component';
import { BacktestOrdersTabComponent } from './pages/backtest/detail/components/backtest-orders-tab/backtest-orders-tab.component';
import { BacktestListComponent } from './pages/backtest/list/backtest-list.component';
import { ConfigVersionHistoryComponent } from './pages/config-history/config-version-history.component';
import { TradingSystemDashboardComponent } from './pages/dashboard/trading-system-dashboard.component';
import { IndicatorConfigFormComponent } from './pages/indicator-config/form/indicator-config-form.component';
import { IndicatorConfigListComponent } from './pages/indicator-config/list/indicator-config-list.component';
import { MarketDataComponent } from './pages/market-data/market-data.component';
import { MarketDataCandleTabComponent } from './pages/market-data/components/market-data-candle-tab/market-data-candle-tab.component';
import { MarketDataSyncTabComponent } from './pages/market-data/components/market-data-sync-tab/market-data-sync-tab.component';
import { MarketDataGapTabComponent } from './pages/market-data/components/market-data-gap-tab/market-data-gap-tab.component';
import { MarketDataImportTabComponent } from './pages/market-data/components/market-data-import-tab/market-data-import-tab.component';
import { CacheMonitorComponent } from './pages/monitoring/cache-monitor.component';
import { PaperTradeComponent } from './pages/paper-trade/paper-trade.component';
import { PaperTradeDataTabsComponent } from './pages/paper-trade/components/paper-trade-data-tabs/paper-trade-data-tabs.component';
import { PaperTradeChartSectionComponent } from './pages/paper-trade/components/paper-trade-chart-section/paper-trade-chart-section.component';
import { PaperTradeCreateDialogsComponent } from './pages/paper-trade/components/paper-trade-create-dialogs/paper-trade-create-dialogs.component';
import { SystemLogsComponent } from './pages/monitoring/system-logs.component';
import { ReplayComponent } from './pages/replay/replay.component';
import { ReplayDebugPanelComponent } from './pages/replay/components/replay-debug-panel/replay-debug-panel.component';
import { RuleConfigFormComponent } from './pages/rule-config/form/rule-config-form.component';
import { RuleConfigListComponent } from './pages/rule-config/list/rule-config-list.component';
import { SandboxComponent } from './pages/sandbox/sandbox.component';
import { StrategyConfigFormComponent } from './pages/strategy-config/form/strategy-config-form.component';
import { StrategyConfigListComponent } from './pages/strategy-config/list/strategy-config-list.component';
import { unsavedChangesGuard } from '../../../shared/ui/form-input/unsaved-changes.guard';
import { ConfigPreviewPanelComponent } from './share/config-preview-panel/config-preview-panel.component';

export const TRADE_BOT_FEATURE_COMPONENTS = [
  TradingSystemDashboardComponent,
  ConfigVersionHistoryComponent,
  MarketDataComponent,
  MarketDataCandleTabComponent,
  MarketDataSyncTabComponent,
  MarketDataGapTabComponent,
  MarketDataImportTabComponent,
  IndicatorConfigListComponent,
  IndicatorConfigFormComponent,
  RuleConfigListComponent,
  RuleConfigFormComponent,
  StrategyConfigListComponent,
  StrategyConfigFormComponent,
  BacktestListComponent,
  BacktestDetailComponent,
  BacktestOverviewTabComponent,
  BacktestChartTabComponent,
  BacktestEquityTabComponent,
  BacktestOrdersTabComponent,
  SandboxComponent,
  ReplayComponent,
  ReplayDebugPanelComponent,
  PaperTradeComponent,
  PaperTradeDataTabsComponent,
  PaperTradeChartSectionComponent,
  PaperTradeCreateDialogsComponent,
  CacheMonitorComponent,
  SystemLogsComponent,
  ConfigPreviewPanelComponent
];

export const tradeBotRoutes: Routes = [
  { path: 'admin/trade-bot', pathMatch: 'full', redirectTo: 'admin/trade-bot/dashboard' },
  { path: 'admin/trade-bot/dashboard', component: TradingSystemDashboardComponent },
  { path: 'admin/trade-bot/market-data', component: MarketDataComponent },
  { path: 'admin/trade-bot/indicator-configs', component: IndicatorConfigListComponent },
  { path: 'admin/trade-bot/indicator-configs/create', component: IndicatorConfigFormComponent, canDeactivate: [unsavedChangesGuard] },
  { path: 'admin/trade-bot/indicator-configs/edit/:id', component: IndicatorConfigFormComponent, canDeactivate: [unsavedChangesGuard] },
  { path: 'admin/trade-bot/rule-configs', component: RuleConfigListComponent },
  { path: 'admin/trade-bot/rule-configs/create', component: RuleConfigFormComponent, canDeactivate: [unsavedChangesGuard] },
  { path: 'admin/trade-bot/rule-configs/edit/:id', component: RuleConfigFormComponent, canDeactivate: [unsavedChangesGuard] },
  { path: 'admin/trade-bot/strategy-configs', component: StrategyConfigListComponent },
  { path: 'admin/trade-bot/strategy-configs/create', component: StrategyConfigFormComponent, canDeactivate: [unsavedChangesGuard] },
  { path: 'admin/trade-bot/strategy-configs/edit/:id', component: StrategyConfigFormComponent, canDeactivate: [unsavedChangesGuard] },
  { path: 'admin/trade-bot/config-history/:type/:id', component: ConfigVersionHistoryComponent },
  { path: 'admin/trade-bot/backtests', component: BacktestListComponent },
  { path: 'admin/trade-bot/backtests/:runId/:reviewTab', component: BacktestDetailComponent },
  { path: 'admin/trade-bot/backtests/:runId', component: BacktestDetailComponent },
  { path: 'admin/trade-bot/sandbox', component: SandboxComponent },
  { path: 'admin/trade-bot/replay', component: ReplayComponent },
  { path: 'admin/trade-bot/paper-trade', component: PaperTradeComponent },
  { path: 'admin/trade-bot/cache-monitor', component: CacheMonitorComponent },
  { path: 'admin/trade-bot/system-logs', component: SystemLogsComponent }
];
