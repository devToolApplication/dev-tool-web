import type { Routes } from '@angular/router';
import { RunCreateComponent } from './pages/run-create/run-create.component';
import { RunDetailComponent } from './pages/run-detail/run-detail.component';
import { RunsOverviewComponent } from './pages/runs-overview/runs-overview.component';
import { StrategiesComponent } from './pages/strategies/strategies.component';

export const quantBacktestRoutes: Routes = [
  {
    path: 'quant-backtest',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'runs',
      },
      {
        path: 'runs',
        component: RunsOverviewComponent,
      },
      {
        path: 'runs/create',
        component: RunCreateComponent,
      },
      {
        path: 'runs/:runId',
        component: RunDetailComponent,
      },
      {
        path: 'strategies',
        component: StrategiesComponent,
      },
    ],
  },
];
