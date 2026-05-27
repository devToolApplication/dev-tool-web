import { Component, computed, EventEmitter, Input, Output, signal } from '@angular/core';
import { CandleBarResponse, CandleGapResponse } from '../../../../../../../core/models/trade-bot/trading-system.model';
import { CandleChartConfig, CandleChartRangeBoundaryEvent, ChartCandle } from '../../../../share/candle-chart/candle-chart';
import { FormContext } from '../../../../../../../shared/ui/form-input/models/form-config.model';
import { TableConfig } from '../../../../../../../shared/ui/table/models/table-config.model';
import { MARKET_DATA_QUERY_FORM } from '../../../../trade-bot-runtime.constants';

@Component({
  selector: 'app-market-data-candle-tab',
  standalone: false,
  templateUrl: './market-data-candle-tab.component.html'
})
export class MarketDataCandleTabComponent {
  @Input() candles: CandleBarResponse[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() gaps: CandleGapResponse[] = [];
  @Output() querySubmit = new EventEmitter<Record<string, unknown>>();
  @Output() rangeBoundaryReached = new EventEmitter<CandleChartRangeBoundaryEvent>();
  @Output() retryQuery = new EventEmitter<void>();
  @Output() viewRawCandle = new EventEmitter<CandleBarResponse>();
  @Output() viewGapsAround = new EventEmitter<CandleBarResponse>();

  readonly queryForm = MARKET_DATA_QUERY_FORM;
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly queryInitialValue = { symbol: 'XAUUSD', timeframe: 'M15', source: 'INTERNAL', marketType: '', feedCode: '', from: '', to: '', limit: 500 };
  readonly selectedRawCandle = signal<CandleBarResponse | null>(null);

  readonly chartConfig = computed<CandleChartConfig>(() => ({
    showCandles: true,
    showVolume: true,
    showLines: false,
    showBoxAreas: false,
    showPoints: false,
    showIndicators: false,
    symbol: this.candles[0]?.symbol,
    interval: this.candles[0]?.timeframe,
    height: 440,
    showOverlayLabels: false,
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

  readonly tableConfig: TableConfig = {
    title: 'tradeBot.market.title',
    columns: [
      { field: 'openTime', header: 'tradeBot.field.openTime', type: 'date', minWidth: '13rem' },
      { field: 'open', header: 'tradeBot.field.open', type: 'number' },
      { field: 'high', header: 'tradeBot.field.high', type: 'number' },
      { field: 'low', header: 'tradeBot.field.low', type: 'number' },
      { field: 'close', header: 'tradeBot.field.close', type: 'number' },
      { field: 'volume', header: 'tradeBot.field.volume', type: 'number' },
      { field: 'quoteVolume', header: 'tradeBot.field.quoteVolume', type: 'number' },
      { field: 'tradeCount', header: 'tradeBot.field.tradeCount', type: 'number' },
      { field: 'closed', header: 'tradeBot.field.closed', type: 'boolean' },
      { field: 'source', header: 'tradeBot.field.source' },
      { field: 'marketType', header: 'tradeBot.field.marketType' },
      { field: 'feedCode', header: 'tradeBot.field.feedCode', minWidth: '12rem' },
      { field: 'candleHash', header: 'tradeBot.field.candleHash', type: 'copyable', minWidth: '16rem', visible: false },
      { field: 'updatedAt', header: 'tradeBot.field.updatedAt', type: 'date', minWidth: '12rem', visible: false },
      {
        field: 'actions',
        header: 'tradeBot.field.actions',
        type: 'actions',
        actions: [
          { label: 'tradeBot.action.viewRaw', icon: 'pi pi-code', severity: 'info', showLabel: false, onClick: (row) => this.onViewRaw(row) },
          { label: 'tradeBot.action.viewGapsAround', icon: 'pi pi-search', severity: 'secondary', showLabel: false, onClick: (row) => this.viewGapsAround.emit(row) }
        ]
      }
    ],
    pagination: true,
    rows: 25,
    scrollable: true,
    minWidth: '64rem'
  };

  onViewRaw(row: CandleBarResponse): void {
    this.selectedRawCandle.set(row);
    this.viewRawCandle.emit(row);
  }

  closeRawCandle(): void {
    this.selectedRawCandle.set(null);
  }

  handleRawCandleOpenChange(open: boolean): void {
    if (!open) {
      this.closeRawCandle();
    }
  }

  rawCandleJson(): CandleBarResponse | null {
    return this.selectedRawCandle();
  }
}
