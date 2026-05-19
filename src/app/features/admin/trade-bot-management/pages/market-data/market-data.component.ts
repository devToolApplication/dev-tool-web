import { Component, DestroyRef, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
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
import { CandleChartConfig, CandleChartRangeBoundaryEvent, ChartCandle } from '../../shared-trading/candle-chart/candle-chart';
import {
  buildAdjacentCandleWindow,
  CANDLE_CHART_WINDOW_LIMIT,
  mergeCandlesByOpenTime
} from '../../shared-trading/candle-chart/candle-window-loader';
import { AppTabItem } from '../../../../../shared/component/tabs/tabs.component';
import { FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { ConfirmDialogService } from '../../../../../shared/ui/overlay/confirm-dialog/confirm-dialog.service';
import {
  BINANCE_USDM_SYNC_FORM,
  CANDLE_IMPORT_FORM,
  MARKET_DATA_QUERY_FORM,
  MARKET_SOURCE_OPTIONS,
  SYMBOL_OPTIONS,
  TIMEFRAME_OPTIONS
} from '../../trade-bot-runtime.constants';
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
    timeframesText: ['1m'],
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
  readonly candleError = signal<string | null>(null);
  readonly syncRunError = signal<string | null>(null);
  readonly gapError = signal<string | null>(null);
  readonly candleQueryModel = signal<Record<string, unknown>>(this.queryInitialValue);
  readonly gapFilterModel = signal<Record<string, unknown>>({ status: 'OPEN' });
  readonly candles = signal<CandleBarResponse[]>([]);
  readonly selectedRawCandle = signal<CandleBarResponse | null>(null);
  readonly syncRuns = signal<CandleSyncRunResponse[]>([]);
  readonly gaps = signal<CandleGapResponse[]>([]);
  readonly syncProgress = signal<TaskProgressState | null>(null);
  readonly activeTab = signal('overview');
  readonly tabs: AppTabItem[] = [
    { label: 'tradeBot.market.tab.overview', value: 'overview' },
    { label: 'tradeBot.market.tab.candles', value: 'candles' },
    { label: 'tradeBot.market.tab.sync', value: 'sync' },
    { label: 'tradeBot.market.tab.gaps', value: 'gaps' },
    { label: 'tradeBot.market.tab.importDebug', value: 'import' }
  ];
  readonly openGaps = computed(() => this.gaps().filter((gap) => String(gap.status ?? '').toUpperCase() === 'OPEN'));
  readonly lastSyncRun = computed(() => this.syncRuns()[0] ?? null);
  readonly latestCandle = computed(() => this.candles().at(-1) ?? null);
  readonly dataQualityCards = computed(() => [
    { label: 'tradeBot.market.summary.totalCandles', value: this.candles().length },
    { label: 'tradeBot.market.summary.latestCandle', value: this.latestCandle()?.openTime ?? null },
    { label: 'tradeBot.market.summary.openGaps', value: this.openGaps().length },
    { label: 'tradeBot.market.summary.lastSyncStatus', value: this.lastSyncRun()?.status ?? null }
  ]);
  readonly gapSummaryCards = computed(() => [
    { label: 'tradeBot.market.summary.openGaps', value: this.openGaps().length },
    { label: 'tradeBot.market.summary.missingBars', value: this.openGaps().reduce((sum, gap) => sum + Number(gap.missingBars ?? 0), 0) },
    { label: 'tradeBot.market.summary.repairedToday', value: this.gaps().filter((gap) => String(gap.status ?? '').toUpperCase() === 'REPAIRED' && isToday(gap.repairedAt)).length },
    { label: 'tradeBot.market.summary.ignoredGaps', value: this.gaps().filter((gap) => String(gap.status ?? '').toUpperCase() === 'IGNORED').length }
  ]);
  readonly overviewFacts = computed(() => {
    const candle = this.latestCandle();
    const syncRun = this.lastSyncRun();
    return [
      { label: 'tradeBot.field.source', value: candle?.source ?? syncRun?.source ?? '-' },
      { label: 'tradeBot.field.symbol', value: candle?.symbol ?? syncRun?.symbol ?? '-' },
      { label: 'tradeBot.field.timeframe', value: candle?.timeframe ?? syncRun?.timeframe ?? '-' }
    ];
  });
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
    showOverlayLabels: false,
    loading: this.loading() && this.candles().length === 0,
    lazyLoadOnPan: true,
    lazyLoadThresholdBars: 32,
    preserveViewportOnDataUpdate: true
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
      { field: 'closed', header: 'tradeBot.field.closed', type: 'boolean' },
      { field: 'source', header: 'tradeBot.field.source' },
      { field: 'marketType', header: 'tradeBot.field.marketType' },
      { field: 'feedCode', header: 'tradeBot.field.feedCode', minWidth: '14rem' },
      { field: 'candleHash', header: 'tradeBot.field.candleHash', type: 'copyable', minWidth: '18rem' },
      { field: 'updatedAt', header: 'tradeBot.field.updatedAt', type: 'date', minWidth: '13rem' },
      {
        field: 'actions',
        header: 'tradeBot.field.actions',
        type: 'actions',
        actions: [
          { label: 'tradeBot.action.viewRaw', icon: 'pi pi-code', severity: 'info', showLabel: false, onClick: (row) => this.selectedRawCandle.set(row) },
          { label: 'tradeBot.action.viewGapsAround', icon: 'pi pi-search', severity: 'secondary', showLabel: false, onClick: (row) => this.viewGapsAround(row) }
        ]
      }
    ],
    pagination: true,
    rows: 25,
    scrollable: true,
    minWidth: '72rem'
  };

  rawCandleJson(): CandleBarResponse | null {
    return this.selectedRawCandle();
  }

  readonly syncRunTableConfig: TableConfig = {
    title: 'tradeBot.sync.runs',
    columns: [
      { field: 'startedAt', header: 'tradeBot.field.startedAt', type: 'date', minWidth: '13rem' },
      { field: 'source', header: 'tradeBot.field.source' },
      { field: 'symbol', header: 'tradeBot.field.symbol' },
      { field: 'timeframe', header: 'tradeBot.field.timeframe' },
      { field: 'mode', header: 'tradeBot.field.mode' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'fetched', header: 'tradeBot.field.fetched', type: 'number' },
      { field: 'inserted', header: 'tradeBot.field.inserted', type: 'number' },
      { field: 'updated', header: 'tradeBot.field.updated', type: 'number' },
      { field: 'gapsDetected', header: 'tradeBot.field.gapsDetected', type: 'number' },
      { field: 'durationMs', header: 'tradeBot.field.duration', type: 'duration' },
      { field: 'errorMessage', header: 'tradeBot.field.errorMessage', minWidth: '16rem' }
    ],
    pagination: true,
    rows: 10,
    scrollable: true,
    minWidth: '100rem'
  };

  readonly gapTableConfig: TableConfig = {
    title: 'tradeBot.sync.gaps',
    filters: [
      { field: 'status', label: 'tradeBot.field.status', type: 'select', options: [
        { label: 'OPEN', value: 'OPEN' },
        { label: 'REPAIRED', value: 'REPAIRED' },
        { label: 'IGNORED', value: 'IGNORED' }
      ], defaultValue: 'OPEN' },
      { field: 'source', label: 'tradeBot.field.source', type: 'select', options: MARKET_SOURCE_OPTIONS },
      { field: 'symbol', label: 'tradeBot.field.symbol', type: 'autocomplete', options: SYMBOL_OPTIONS },
      { field: 'timeframe', label: 'tradeBot.field.timeframe', type: 'select', options: TIMEFRAME_OPTIONS }
    ],
    filterOptions: { primaryField: 'symbol', enableUrlSync: true },
    columns: [
      { field: 'createdAt', header: 'tradeBot.field.createdAt', type: 'date', minWidth: '13rem' },
      { field: 'source', header: 'tradeBot.field.source' },
      { field: 'marketType', header: 'tradeBot.field.marketType' },
      { field: 'feedCode', header: 'tradeBot.field.feedCode', minWidth: '14rem' },
      { field: 'symbol', header: 'tradeBot.field.symbol' },
      { field: 'timeframe', header: 'tradeBot.field.timeframe' },
      { field: 'expectedOpenTime', header: 'tradeBot.field.expectedOpenTime', type: 'date', minWidth: '13rem' },
      { field: 'nextAvailableOpenTime', header: 'tradeBot.field.nextAvailableOpenTime', type: 'date', minWidth: '13rem' },
      { field: 'missingBars', header: 'tradeBot.field.missingBars', type: 'number' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'detectedRunId', header: 'tradeBot.field.detectedRunId', type: 'copyable', minWidth: '18rem' },
      { field: 'repairedRunId', header: 'tradeBot.field.repairedRunId', type: 'copyable', minWidth: '18rem' },
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
          },
          {
            label: 'tradeBot.action.viewSyncRun',
            icon: 'pi pi-history',
            severity: 'info',
            showLabel: false,
            onClick: () => this.onTabChange('sync')
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
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService,
    private readonly confirmDialogService: ConfirmDialogService,
    private readonly destroyRef: DestroyRef
  ) {
    this.activeTab.set(resolveTab(this.route.snapshot.queryParamMap.get('tab')));
    this.loadSyncRuns();
    const initialGapFilter = { status: this.route.snapshot.queryParamMap.get('status') ?? 'OPEN' };
    this.gapFilterModel.set(initialGapFilter);
    this.loadGaps(initialGapFilter);
  }

  loadCandles(model: Record<string, unknown>): void {
    this.candleQueryModel.set(model);
    const filters = normalizeFilterModel(model);
    this.loading.set(true);
    this.candleError.set(null);
    this.loadingService
      .track(this.service.getCandles({ ...filters, limit: CANDLE_CHART_WINDOW_LIMIT, latest: true }))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (candles) => {
          this.candles.set(candles);
          this.candleError.set(null);
        },
        error: () => {
          const message = this.i18nService.t('tradeBot.message.loadFailed');
          this.candleError.set(message);
          this.toastService.error(message);
        }
      });
  }

  loadMoreCandles(event: CandleChartRangeBoundaryEvent): void {
    if (this.loading()) {
      return;
    }
    const filters = normalizeFilterModel(this.candleQueryModel());
    const window = buildAdjacentCandleWindow({
      direction: event.direction,
      timeframe: String(filters['timeframe'] ?? ''),
      firstOpenTime: event.firstCandle?.openTime ?? event.firstCandle?.time,
      lastOpenTime: event.lastCandle?.openTime ?? event.lastCandle?.time,
      minTime: filters['from'],
      maxTime: filters['to'],
      limit: CANDLE_CHART_WINDOW_LIMIT
    });
    if (!window) {
      return;
    }
    this.loading.set(true);
    this.service
      .getCandles({ ...filters, ...window })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (candles) => {
          this.candles.set(mergeCandlesByOpenTime(this.candles(), candles));
          this.candleError.set(null);
        },
        error: () => undefined
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
      fromTime: optionalIsoText(model['fromTime']),
      toTime: optionalIsoText(model['toTime']),
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

  async repairGap(gap: CandleGapResponse): Promise<void> {
    const confirmed = await this.confirmDialogService.confirm({ message: 'tradeBot.message.confirmRepairGap' });
    if (!confirmed) {
      return;
    }
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

  async ignoreGap(gap: CandleGapResponse): Promise<void> {
    const confirmed = await this.confirmDialogService.confirm({ message: 'tradeBot.message.confirmIgnoreGap' });
    if (!confirmed) {
      return;
    }
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

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  closeRawCandle(): void {
    this.selectedRawCandle.set(null);
  }

  handleRawCandleOpenChange(open: boolean): void {
    if (!open) {
      this.closeRawCandle();
    }
  }

  loadGaps(filters?: Record<string, unknown>): void {
    const nextFilters = filters ?? this.gapFilterModel();
    this.gapFilterModel.set(nextFilters);
    this.gapError.set(null);
    this.service.getCandleGaps({ limit: 50, ...nextFilters }).subscribe({
      next: (gaps) => {
        this.gaps.set(gaps);
        this.gapError.set(null);
      },
      error: () => {
        this.gapError.set(this.i18nService.t('tradeBot.message.loadFailed'));
      }
    });
  }

  private viewGapsAround(candle: CandleBarResponse): void {
    this.activeTab.set('gaps');
    this.loadGaps({
      status: 'OPEN',
      source: candle.source,
      symbol: candle.symbol,
      timeframe: candle.timeframe
    });
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

  loadSyncRuns(): void {
    this.syncRunError.set(null);
    this.service.getCandleSyncRuns({ limit: 50 }).subscribe({
      next: (runs) => {
        this.syncRuns.set(runs);
        this.syncRunError.set(null);
      },
      error: () => {
        this.syncRunError.set(this.i18nService.t('tradeBot.message.loadFailed'));
      }
    });
  }

}

function splitCsv(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  }
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalText(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function optionalIsoText(value: unknown): string | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }
  return optionalText(value);
}

function normalizeFilterModel(model: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(model).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value])
  );
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

function resolveTab(tab: string | null): string {
  return ['overview', 'candles', 'sync', 'gaps', 'import'].includes(String(tab)) ? String(tab) : 'overview';
}

function isToday(value?: string): boolean {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}
