import { Routes } from '@angular/router';
import { TradeBotChartViewComponent } from './chart/view/trade-bot-chart-view.component';
import { SyncConfigFormComponent } from './sync-config/form/sync-config-form.component';
import { SyncConfigListComponent } from './sync-config/list/sync-config-list.component';

export const TRADE_BOT_FEATURE_COMPONENTS = [SyncConfigListComponent, SyncConfigFormComponent, TradeBotChartViewComponent];

export const tradeBotRoutes: Routes = [
  { path: 'admin/trade-bot', redirectTo: 'admin/trade-bot/data-source', pathMatch: 'full' },
  {
    path: 'admin/trade-bot/data-source',
    children: [
      { path: '', component: SyncConfigListComponent },
      { path: 'create', component: SyncConfigFormComponent },
      { path: 'edit/:id', component: SyncConfigFormComponent },
      { path: ':id/chart', component: TradeBotChartViewComponent }
    ]
  }
];
