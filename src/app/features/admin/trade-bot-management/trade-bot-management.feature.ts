import { Routes } from '@angular/router';
import { BacktestDetailComponent } from './pages/backtest/detail/backtest-detail.component';
import { BacktestListComponent } from './pages/backtest/list/backtest-list.component';
import { ConfigVersionHistoryComponent } from './pages/config-history/config-version-history.component';
import { TradingSystemDashboardComponent } from './pages/dashboard/trading-system-dashboard.component';
import { IndicatorConfigFormComponent } from './pages/indicator-config/form/indicator-config-form.component';
import { IndicatorConfigListComponent } from './pages/indicator-config/list/indicator-config-list.component';
import { MarketDataComponent } from './pages/market-data/market-data.component';
import { CacheMonitorComponent } from './pages/monitoring/cache-monitor.component';
import { PaperTradeComponent } from './pages/paper-trade/paper-trade.component';
import { SystemLogsComponent } from './pages/monitoring/system-logs.component';
import { ReplayComponent } from './pages/replay/replay.component';
import { RuleConfigFormComponent } from './pages/rule-config/form/rule-config-form.component';
import { RuleConfigListComponent } from './pages/rule-config/list/rule-config-list.component';
import { SandboxComponent } from './pages/sandbox/sandbox.component';
import { StrategyConfigFormComponent } from './pages/strategy-config/form/strategy-config-form.component';
import { StrategyConfigListComponent } from './pages/strategy-config/list/strategy-config-list.component';
import { unsavedChangesGuard } from '../../../shared/ui/form-input/unsaved-changes.guard';

export const TRADE_BOT_FEATURE_COMPONENTS = [
  TradingSystemDashboardComponent,
  ConfigVersionHistoryComponent,
  MarketDataComponent,
  IndicatorConfigListComponent,
  IndicatorConfigFormComponent,
  RuleConfigListComponent,
  RuleConfigFormComponent,
  StrategyConfigListComponent,
  StrategyConfigFormComponent,
  BacktestListComponent,
  BacktestDetailComponent,
  SandboxComponent,
  ReplayComponent,
  PaperTradeComponent,
  CacheMonitorComponent,
  SystemLogsComponent
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
