import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@shared/shared.module';

import { EquityChartComponent } from './components/equity-chart/equity-chart.component';
import { WizardStepIndicatorComponent } from './components/wizard-step-indicator/wizard-step-indicator.component';
import { RunCreateComponent } from './pages/run-create/run-create.component';
import { RunDetailComponent } from './pages/run-detail/run-detail.component';
import { RunsOverviewComponent } from './pages/runs-overview/runs-overview.component';
import { StrategiesComponent } from './pages/strategies/strategies.component';
import { quantBacktestRoutes } from './quant-backtest.routes';

const COMPONENTS = [
  RunsOverviewComponent,
  RunCreateComponent,
  RunDetailComponent,
  StrategiesComponent,
  EquityChartComponent,
  WizardStepIndicatorComponent,
];

@NgModule({
  declarations: [...COMPONENTS],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(quantBacktestRoutes),
    SharedModule,
  ],
  exports: [...COMPONENTS],
})
export class QuantBacktestModule {}
