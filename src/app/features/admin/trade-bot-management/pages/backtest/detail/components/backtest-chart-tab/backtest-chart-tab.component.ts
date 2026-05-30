import { Component, computed, EventEmitter, Input, Output } from '@angular/core';
import { CandleBarResponse } from '../../../../../../../../core/models/trade-bot/trading-system.model';
import { CandleChartConfig, CandleChartRangeBoundaryEvent, ChartCandle, ChartOverlay } from '../../../../../../../../shared/ui/candle-chart';

@Component({
  selector: 'app-backtest-chart-tab',
  standalone: false,
  templateUrl: './backtest-chart-tab.component.html'
})
export class BacktestChartTabComponent {
  @Input() chartCandlesRaw: CandleBarResponse[] = [];
  @Input() chartReviewOverlays: ChartOverlay[] = [];
  @Input() marketDataSnapshot: Record<string, unknown> | null = null;
  @Input() symbol = '';
  @Input() timeframe = '';
  @Input() chartLoading = false;
  @Output() rangeBoundaryReached = new EventEmitter<CandleChartRangeBoundaryEvent>();

  readonly chartConfig = computed<CandleChartConfig>(() => ({
    showCandles: true,
    showVolume: true,
    showLines: false,
    showBoxAreas: false,
    showPoints: false,
    showIndicators: false,
    symbol: this.symbol,
    interval: this.timeframe,
    height: 460,
    showOverlayLabels: true,
    showToolbar: true,
    showDebugPanel: false,
    loading: this.chartLoading && this.chartCandlesRaw.length === 0,
    lazyLoadOnPan: true,
    lazyLoadThresholdBars: 32,
    preserveViewportOnDataUpdate: true
  }));

  readonly chartCandles = computed<ChartCandle[]>(() =>
    this.chartCandlesRaw.map((candle, index) => ({
      index,
      time: candle.openTime,
      openTime: candle.openTime,
      closeTime: candle.closeTime,
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close),
      volume: Number(candle.volume ?? 0),
      closed: candle.closed
    }))
  );
}
