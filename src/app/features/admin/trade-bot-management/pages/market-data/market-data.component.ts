import { Component, DestroyRef, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RealtimeTaskType, TaskProgressState } from '../../../../../core/models/realtime/realtime.model';
import { BinanceUsdmCandleSyncDto, CandleBarResponse, CandleGapResponse, CandleSyncRunResponse } from '../../../../../core/models/trade-bot/trading-system.model';
import { RealtimeTaskStateService } from '../../../../../core/services/realtime/realtime-task-state.service';
import { RealtimeWebSocketService } from '../../../../../core/services/realtime/realtime-websocket.service';
import { TaskProgressStoreService } from '../../../../../core/services/realtime/task-progress-store.service';
import { MarketDataService } from '../../../../../core/services/trade-bot-service/market-data.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { CandleChartConfig, ChartCandle } from '../../shared-trading/candle-chart/candle-chart';
import { FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { BINANCE_USDM_SYNC_FORM, CANDLE_IMPORT_FORM, MARKET_DATA_QUERY_FORM } from '../../trade-bot-runtime.constants';
import { parseJson } from '../../trade-bot-form-utils';

@Component({
  selector: 'app-trade-bot-market-data',
  standalone: false,
  templateUrl: './market-data.component.html'
})
export class MarketDataComponent {
  readonly queryForm = MARKET_DATA_QUERY_FORM;
  readonly importForm = CANDLE_IMPORT_FORM;
  readonly syncForm = BINANCE_USDM_SYNC_FORM;
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly queryInitialValue = { symbol: 'XAUUSD', timeframe: 'M15', source: 'INTERNAL', marketType: '', feedCode: '', from: '', to: '', limit: 500 };
  readonly importInitialValue = { payload: JSON.stringify({ candles: [] }, null, 2) };
  readonly syncInitialValue = {
    symbolsText: 'BTCUSDT',
    timeframesText: '1m',
    mode: 'latest',
    fromTime: '',
    toTime: '',
    initialLookbackHours: 24,
    limit: 1000,
    maxPages: null,
    lookbackBars: 3,
    onlyClosedCandle: true
  };
  readonly loading = signal(false);
  readonly syncLoading = signal(false);
  readonly candles = signal<CandleBarResponse[]>([]);
  readonly selectedRawCandle = signal<CandleBarResponse | null>(null);
  readonly syncRuns = signal<CandleSyncRunResponse[]>([]);
  readonly gaps = signal<CandleGapResponse[]>([]);
  readonly syncProgress = signal<TaskProgressState | null>(null);
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
      { field: 'quoteVolume', header: 'tradeBot.field.quoteVolume', type: 'number' },
      { field: 'tradeCount', header: 'tradeBot.field.tradeCount', type: 'number' },
      { field: 'source', header: 'tradeBot.field.source' },
      { field: 'marketType', header: 'tradeBot.field.marketType' },
      { field: 'feedCode', header: 'tradeBot.field.feedCode', minWidth: '14rem' },
      { field: 'candleHash', header: 'tradeBot.field.candleHash', minWidth: '18rem' },
      { field: 'updatedAt', header: 'tradeBot.field.updatedAt', type: 'date', minWidth: '13rem' },
      {
        field: 'actions',
        header: 'tradeBot.field.actions',
        type: 'actions',
        actions: [{ label: 'tradeBot.action.viewRaw', icon: 'pi pi-code', severity: 'info', onClick: (row) => this.selectedRawCandle.set(row) }]
      }
    ],
    pagination: true,
    rows: 25,
    scrollable: true,
    minWidth: '72rem'
  };

  rawCandleJson(): string {
    return JSON.stringify(this.selectedRawCandle(), null, 2);
  }

  readonly syncRunTableConfig: TableConfig = {
    title: 'tradeBot.sync.runs',
    columns: [
      { field: 'startedAt', header: 'tradeBot.field.startedAt', type: 'date', minWidth: '13rem' },
      { field: 'source', header: 'tradeBot.field.source' },
      { field: 'symbol', header: 'tradeBot.field.symbol' },
      { field: 'timeframe', header: 'tradeBot.field.timeframe' },
      { field: 'mode', header: 'tradeBot.field.mode' },
      { field: 'status', header: 'tradeBot.field.status' },
      { field: 'fetched', header: 'tradeBot.field.fetched', type: 'number' },
      { field: 'inserted', header: 'tradeBot.field.inserted', type: 'number' },
      { field: 'updated', header: 'tradeBot.field.updated', type: 'number' },
      { field: 'gapsDetected', header: 'tradeBot.field.gapsDetected', type: 'number' },
      { field: 'errorMessage', header: 'tradeBot.field.errorMessage', minWidth: '16rem' }
    ],
    pagination: true,
    rows: 10,
    scrollable: true,
    minWidth: '100rem'
  };

  readonly gapTableConfig: TableConfig = {
    title: 'tradeBot.sync.gaps',
    columns: [
      { field: 'createdAt', header: 'tradeBot.field.createdAt', type: 'date', minWidth: '13rem' },
      { field: 'source', header: 'tradeBot.field.source' },
      { field: 'symbol', header: 'tradeBot.field.symbol' },
      { field: 'timeframe', header: 'tradeBot.field.timeframe' },
      { field: 'expectedOpenTime', header: 'tradeBot.field.expectedOpenTime', type: 'date', minWidth: '13rem' },
      { field: 'nextAvailableOpenTime', header: 'tradeBot.field.nextAvailableOpenTime', type: 'date', minWidth: '13rem' },
      { field: 'missingBars', header: 'tradeBot.field.missingBars', type: 'number' },
      { field: 'status', header: 'tradeBot.field.status' },
      {
        field: 'actions',
        header: 'tradeBot.field.actions',
        type: 'actions',
        minWidth: '13rem',
        actions: [
          {
            label: 'tradeBot.action.repairGap',
            icon: 'pi pi-wrench',
            severity: 'warn',
            showLabel: false,
            disabled: (row) => this.isClosedGap(row),
            onClick: (row) => this.repairGap(row)
          },
          {
            label: 'tradeBot.action.ignoreGap',
            icon: 'pi pi-ban',
            severity: 'secondary',
            showLabel: false,
            disabled: (row) => this.isClosedGap(row),
            onClick: (row) => this.ignoreGap(row)
          }
        ]
      }
    ],
    pagination: true,
    rows: 10,
    scrollable: true,
    minWidth: '92rem'
  };

  constructor(
    private readonly service: MarketDataService,
    private readonly realtimeWebSocketService: RealtimeWebSocketService,
    private readonly progressStore: TaskProgressStoreService,
    private readonly taskStateService: RealtimeTaskStateService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService,
    private readonly destroyRef: DestroyRef
  ) {
    this.loadSyncRuns();
    this.loadGaps();
  }

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

  syncBinanceUsdm(model: Record<string, unknown>): void {
    const mode = String(model['mode'] ?? 'latest') as 'latest' | 'range' | 'backfill' | 'repair-gap';
    const payload: BinanceUsdmCandleSyncDto = {
      symbols: splitCsv(model['symbolsText']),
      timeframes: splitCsv(model['timeframesText']),
      fromTime: optionalText(model['fromTime']),
      toTime: optionalText(model['toTime']),
      initialLookbackHours: numberOrUndefined(model['initialLookbackHours']),
      limit: numberOrUndefined(model['limit']),
      maxPages: numberOrUndefined(model['maxPages']),
      lookbackBars: numberOrUndefined(model['lookbackBars']),
      onlyClosedCandle: Boolean(model['onlyClosedCandle']),
      triggerType: 'MANUAL',
      requestedBy: 'dev-tool-web'
    };
    this.syncLoading.set(true);
    this.loadingService
      .track(this.service.syncBinanceUsdm(payload, mode))
      .pipe(finalize(() => this.syncLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.toastService.info(this.i18nService.t('tradeBot.message.syncStarted'));
          this.watchProgress(taskTypeForMode(mode), response.runId);
          this.loadSyncRuns();
          this.loadGaps();
        },
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.syncFailed'))
      });
  }

  cancelSync(): void {
    const state = this.syncProgress();
    if (state) {
      this.realtimeWebSocketService.cancelTask(state.taskType, state.taskId);
    }
  }

  repairGap(gap: CandleGapResponse): void {
    this.syncLoading.set(true);
    this.loadingService
      .track(this.service.repairCandleGap(gap.id))
      .pipe(finalize(() => this.syncLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.toastService.info(this.i18nService.t('tradeBot.message.gapRepairStarted'));
          this.watchProgress('MARKET_DATA_REPAIR_GAP', response.runId);
          this.loadSyncRuns();
          this.loadGaps();
        },
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.gapActionFailed'))
      });
  }

  ignoreGap(gap: CandleGapResponse): void {
    this.syncLoading.set(true);
    this.loadingService
      .track(this.service.ignoreCandleGap(gap.id))
      .pipe(finalize(() => this.syncLoading.set(false)))
      .subscribe({
        next: () => {
          this.toastService.info(this.i18nService.t('tradeBot.message.gapIgnoreSuccess'));
          this.loadGaps();
        },
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.gapActionFailed'))
      });
  }

  isClosedGap(gap: CandleGapResponse): boolean {
    return ['REPAIRED', 'IGNORED'].includes(String(gap.status ?? '').toUpperCase());
  }

  private watchProgress(taskType: RealtimeTaskType, taskId: string): void {
    this.realtimeWebSocketService
      .subscribeProgress(taskType, taskId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.progressStore.update(event));
    this.progressStore
      .getState$(taskType, taskId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => this.syncProgress.set(state));
    this.taskStateService.getLatestState(taskType, taskId).subscribe((state) => {
      if (state) {
        this.progressStore.patch(state);
      }
    });
  }

  private loadSyncRuns(): void {
    this.service.getCandleSyncRuns({ limit: 50 }).subscribe({
      next: (runs) => this.syncRuns.set(runs),
      error: () => undefined
    });
  }

  private loadGaps(): void {
    this.service.getCandleGaps({ limit: 50 }).subscribe({
      next: (gaps) => this.gaps.set(gaps),
      error: () => undefined
    });
  }
}

function splitCsv(value: unknown): string[] {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalText(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function numberOrUndefined(value: unknown): number | undefined {
  const text = String(value ?? '').trim();
  if (!text) {
    return undefined;
  }
  const number = Number(text);
  return Number.isFinite(number) ? number : undefined;
}

function taskTypeForMode(mode: 'latest' | 'range' | 'backfill' | 'repair-gap'): RealtimeTaskType {
  if (mode === 'backfill') {
    return 'MARKET_DATA_BACKFILL';
  }
  if (mode === 'repair-gap') {
    return 'MARKET_DATA_REPAIR_GAP';
  }
  return 'MARKET_DATA_SYNC';
}
