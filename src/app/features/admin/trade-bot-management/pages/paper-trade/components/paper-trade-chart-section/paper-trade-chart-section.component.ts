import { Component, computed, EventEmitter, Input, Output } from '@angular/core';
import { CandleBarResponse } from '../../../../../../../core/models/trade-bot/trading-system.model';
import { PaperTradePosition } from '../../../../data-access/models/paper-trade.model';
import { CandleChartConfig, CandleChartRangeBoundaryEvent, ChartCandle, ChartOverlay } from '../../../../share/candle-chart/candle-chart';

@Component({
  selector: 'app-paper-trade-chart-section',
  standalone: false,
  templateUrl: './paper-trade-chart-section.component.html'
})
export class PaperTradeChartSectionComponent {
  @Input() candles: CandleBarResponse[] = [];
  @Input() overlays: ChartOverlay[] = [];
  @Input() activePositions: PaperTradePosition[] = [];
  @Input() symbol = 'BTCUSDT';
  @Input() interval = '1m';
  @Input() loading = false;
  @Output() rangeBoundaryReached = new EventEmitter<CandleChartRangeBoundaryEvent>();

  readonly chartConfig = computed<CandleChartConfig>(() => ({
    mode: 'HISTORICAL',
    symbol: this.symbol,
    interval: this.interval,
    exchange: 'Binance USD-M',
    showCandles: true,
    showVolume: true,
    showPoints: true,
    showLines: true,
    showBoxAreas: true,
    showOverlayLabels: true,
    height: 520,
    loading: this.loading && this.candles.length === 0,
    lazyLoadOnPan: true,
    lazyLoadThresholdBars: 32,
    preserveViewportOnDataUpdate: true
  }));

  readonly chartCandles = computed<ChartCandle[]>(() =>
    this.candles.map((candle, index) => ({
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
