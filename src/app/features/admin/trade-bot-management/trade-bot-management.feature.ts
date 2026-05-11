import { Routes } from '@angular/router';
import { BacktestDetailComponent } from './backtest/detail/backtest-detail.component';
import { BacktestListComponent } from './backtest/list/backtest-list.component';
import { IndicatorConfigFormComponent } from './indicator-config/form/indicator-config-form.component';
import { IndicatorConfigListComponent } from './indicator-config/list/indicator-config-list.component';
import { MarketDataComponent } from './market-data/market-data.component';
import { ReplayComponent } from './replay/replay.component';
import { RuleConfigFormComponent } from './rule-config/form/rule-config-form.component';
import { RuleConfigListComponent } from './rule-config/list/rule-config-list.component';
import { StrategyConfigFormComponent } from './strategy-config/form/strategy-config-form.component';
import { StrategyConfigListComponent } from './strategy-config/list/strategy-config-list.component';

export const TRADE_BOT_FEATURE_COMPONENTS = [
  MarketDataComponent,
  IndicatorConfigListComponent,
  IndicatorConfigFormComponent,
  RuleConfigListComponent,
  RuleConfigFormComponent,
  StrategyConfigListComponent,
  StrategyConfigFormComponent,
  BacktestListComponent,
  BacktestDetailComponent,
  ReplayComponent
];

export const tradeBotRoutes: Routes = [
  { path: 'admin/trade-bot', pathMatch: 'full', redirectTo: 'admin/trade-bot/market-data' },
  { path: 'admin/trade-bot/market-data', component: MarketDataComponent },
  { path: 'admin/trade-bot/indicator-configs', component: IndicatorConfigListComponent },
  { path: 'admin/trade-bot/indicator-configs/create', component: IndicatorConfigFormComponent },
  { path: 'admin/trade-bot/indicator-configs/edit/:id', component: IndicatorConfigFormComponent },
  { path: 'admin/trade-bot/rule-configs', component: RuleConfigListComponent },
  { path: 'admin/trade-bot/rule-configs/create', component: RuleConfigFormComponent },
  { path: 'admin/trade-bot/rule-configs/edit/:id', component: RuleConfigFormComponent },
  { path: 'admin/trade-bot/strategy-configs', component: StrategyConfigListComponent },
  { path: 'admin/trade-bot/strategy-configs/create', component: StrategyConfigFormComponent },
  { path: 'admin/trade-bot/strategy-configs/edit/:id', component: StrategyConfigFormComponent },
  { path: 'admin/trade-bot/backtests', component: BacktestListComponent },
  { path: 'admin/trade-bot/backtests/:runId', component: BacktestDetailComponent },
  { path: 'admin/trade-bot/replay', component: ReplayComponent }
];
