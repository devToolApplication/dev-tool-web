import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared.module';
import { CandleChart } from './candle-chart';
import { CandleChartHeaderComponent } from './components/candle-chart-header/candle-chart-header.component';
import { CandleChartReplayControlsComponent } from './components/candle-chart-replay-controls/candle-chart-replay-controls.component';
import { CandleChartStateOverlayComponent } from './components/candle-chart-state-overlay/candle-chart-state-overlay.component';
import { CandleChartToolbarComponent } from './components/candle-chart-toolbar/candle-chart-toolbar.component';

const DECLARATIONS = [
  CandleChart,
  CandleChartHeaderComponent,
  CandleChartReplayControlsComponent,
  CandleChartStateOverlayComponent,
  CandleChartToolbarComponent,
];

@NgModule({
  declarations: DECLARATIONS,
  imports: [CommonModule, SharedModule],
  exports: DECLARATIONS,
})
export class CandleChartModule {}
