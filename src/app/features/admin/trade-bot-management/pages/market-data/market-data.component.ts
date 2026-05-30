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
import { CandleChartRangeBoundaryEvent } from '../../../../../shared/ui/candle-chart';
import {
  buildAdjacentCandleWindow,
  CANDLE_CHART_WINDOW_LIMIT,
  mergeCandlesByOpenTime
} from '../../../../../shared/ui/candle-chart';
import { AppTabItem } from '../../../../../shared/component/tabs/tabs.component';
import { ConfirmDialogService } from '../../../../../shared/ui/overlay/confirm-dialog/confirm-dialog.service';
import { parseJson } from '../../trade-bot-form-utils';

@Component({
  selector: 'app-trade-bot-market-data',
  standalone: false,
  templateUrl: './market-data.component.html'
})
export class MarketDataComponent {
  readonly loading = signal(false);
  readonly syncLoading = signal(false);
  readonly candleError = signal<string | null>(null);
  readonly syncRunError = signal<string | null>(null);
  readonly gapError = signal<string | null>(null);
  readonly candleQueryModel = signal<Record<string, unknown>>({ symbol: 'XAUUSD', timeframe: 'M15', source: 'INTERNAL', marketType: '', feedCode: '', from: '', to: '', limit: 500 });
  readonly gapFilterModel = signal<Record<string, unknown>>({ status: 'OPEN' });
  readonly candles = signal<CandleBarResponse[]>([]);
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
  readonly overviewFacts = computed(() => {
    const candle = this.latestCandle();
    const syncRun = this.lastSyncRun();
    return [
      { label: 'tradeBot.field.source', value: candle?.source ?? syncRun?.source ?? '-' },
      { label: 'tradeBot.field.symbol', value: candle?.symbol ?? syncRun?.symbol ?? '-' },
      { label: 'tradeBot.field.timeframe', value: candle?.timeframe ?? syncRun?.timeframe ?? '-' }
    ];
  });

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

  importCandles(model: Record<string, unknown>): void {
    let payload;
    try {
      payload = parseJson(model['payload'], { candles: [] });
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

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
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
