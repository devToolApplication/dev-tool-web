import { Component, computed, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { CandleBarResponse } from '../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../core/ui-services/toast.service';
import { CandleChartConfig, ChartCandle } from '../../../../shared/component/candle-chart/candle-chart';
import { FormContext } from '../../../../shared/ui/form-input/models/form-config.model';
import { TableConfig } from '../../../../shared/ui/table/models/table-config.model';
import { CANDLE_IMPORT_FORM, MARKET_DATA_QUERY_FORM } from '../trade-bot-runtime.constants';
import { parseJson } from '../trade-bot-form-utils';

@Component({
  selector: 'app-trade-bot-market-data',
  standalone: false,
  templateUrl: './market-data.component.html'
})
export class MarketDataComponent {
  readonly queryForm = MARKET_DATA_QUERY_FORM;
  readonly importForm = CANDLE_IMPORT_FORM;
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly queryInitialValue = { symbol: 'XAUUSD', timeframe: 'M15', from: '', to: '', limit: 500 };
  readonly importInitialValue = { payload: JSON.stringify({ candles: [] }, null, 2) };
  readonly loading = signal(false);
  readonly candles = signal<CandleBarResponse[]>([]);
  readonly chartConfig = computed<CandleChartConfig>(() => ({
    showCandles: true,
    showVolume: true,
    showLines: false,
    showBoxAreas: false,
    showPoints: false,
    showIndicators: false,
    symbol: this.candles()[0]?.symbol,
    interval: this.candles()[0]?.timeframe,
    height: 440,
    showOverlayLabels: false
  }));
  readonly chartCandles = computed<ChartCandle[]>(() =>
    this.candles().map((candle, index) => ({
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
      { field: 'source', header: 'tradeBot.field.source' }
    ],
    pagination: true,
    rows: 25,
    scrollable: true,
    minWidth: '72rem'
  };

  constructor(
    private readonly service: TradingSystemService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  loadCandles(model: Record<string, unknown>): void {
    this.loading.set(true);
    this.loadingService
      .track(this.service.getCandles(model))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (candles) => this.candles.set(candles),
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.loadFailed'))
      });
  }

  importCandles(model: { payload: string }): void {
    let payload;
    try {
      payload = parseJson(model.payload, { candles: [] });
    } catch {
      this.toastService.error(this.i18nService.t('tradeBot.message.invalidJson'));
      return;
    }
    this.loading.set(true);
    this.loadingService
      .track(this.service.bulkImportCandles(payload))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.toastService.info(`${this.i18nService.t('tradeBot.message.imported')} ${response.imported}`),
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.saveFailed'))
      });
  }
}
