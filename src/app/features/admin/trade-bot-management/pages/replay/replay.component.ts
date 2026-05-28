import { Component, DestroyRef, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { BacktestRunResponse, ReplayInitDto, ReplayInitResponse } from '../../../../../core/models/trade-bot/trading-system.model';
import { RealtimeProgressEvent, RealtimeTaskStatus } from '../../../../../core/models/realtime/realtime.model';
import { RealtimeWebSocketService, ReplayCommandType } from '../../../../../core/services/realtime/realtime-websocket.service';
import { ReplayService } from '../../../../../core/services/trade-bot-service/replay.service';
import { StrategyDebugService } from '../../../../../core/services/trade-bot-service/strategy-debug.service';
import { TradingSystemService } from '../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { AppTabItem } from '../../../../../shared/component/tabs/tabs.component';
import {
  CandleChartBarChangedEvent,
  CandleChartConfig,
  CandleChartEvaluationResult,
  CandleChartReplayCommand,
  CandleChartReplayState,
  CandleChartStatus,
  ChartCandle,
  ChartIndicator,
  EvaluationConfig,
  ReplayConfig
} from '../../share/candle-chart/candle-chart';
import { CandleChartOverlayMapper } from '../../share/candle-chart/candle-chart-overlay.mapper';
import { FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { EVALUATE_FORM, REPLAY_INIT_FORM } from '../../trade-bot-runtime.constants';
import { parseJson } from '../../trade-bot-form-utils';

@Component({
  selector: 'app-trade-bot-replay',
  standalone: false,
  templateUrl: './replay.component.html',
  styleUrl: './replay.component.css'
})
export class ReplayComponent {
  readonly replayForm = REPLAY_INIT_FORM;
  readonly evaluateForm = EVALUATE_FORM;
  formContext: FormContext = { user: null, mode: 'create', extra: { strategyOptions: [], runOptions: [] } };
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly replay = signal<ReplayInitResponse | null>(null);
  readonly replayEvent = signal<RealtimeProgressEvent | null>(null);
  readonly evaluation = signal<Record<string, unknown> | null>(null);
  readonly strategySignal = signal<Record<string, unknown> | null>(null);
  readonly ruleTrace = signal<Record<string, unknown> | null>(null);
  readonly selectedCandle = signal<ChartCandle | null>(null);
  readonly replaySpeed = signal(650);
  readonly activeTab = signal('signal');
  readonly chartConfig = computed<CandleChartConfig>(() => ({
    showVolume: true,
    showLines: false,
    showBoxAreas: false,
    showPoints: false,
    showIndicators: false,
    symbol: this.replay()?.symbol,
    interval: this.replay()?.timeframe,
    height: 460,
    showOverlayLabels: true,
    showReplayControls: true,
    showToolbar: true,
    showDebugPanel: true,
    evaluateOnBarChange: true,
    preserveViewportOnDataUpdate: true
  }));
  readonly chartCandles = computed<ChartCandle[]>(() =>
    (this.replay()?.candles ?? []).map((candle, index) => ({
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
  readonly chartIndicators = computed<ChartIndicator[]>(() => {
    const overlays = this.replay()?.overlay?.overlays ?? {};
    return this.overlayMapper.indicatorsFromOverlayRecord(overlays, this.chartCandles());
  });
  readonly replayConfig = computed<ReplayConfig>(() => ({
    initialIndex: 0,
    speedMs: this.replaySpeed(),
    autoPlay: false,
    loop: false
  }));
  readonly replayInitialValue = {
    strategyCode: '',
    symbol: 'XAUUSD',
    timeframe: 'M15',
    source: 'INTERNAL',
    marketType: '',
    feedCode: '',
    fromTime: '',
    toTime: '',
    overlayCodesText: '[]'
  };
  readonly replayModel = signal<Record<string, unknown>>(this.replayInitialValue);
  readonly evaluateInitialValue = { runId: '', index: 0 };
  readonly evaluateModel = signal<Record<string, unknown>>(this.evaluateInitialValue);
  readonly replayFacts = computed(() => [
    { label: 'tradeBot.field.strategyCode', value: this.replay()?.strategyCode ?? '-' },
    { label: 'tradeBot.field.symbol', value: this.replay()?.symbol ?? '-' },
    { label: 'tradeBot.field.timeframe', value: this.replay()?.timeframe ?? '-' },
    { label: 'tradeBot.replay.currentIndex', value: this.replay()?.currentIndex ?? 0 },
    { label: 'tradeBot.replay.candleCount', value: this.replay()?.candles?.length ?? 0 },
    { label: 'tradeBot.field.status', value: this.replayStatus() }
  ]);
  readonly backendSessionStatus = computed(() => this.replayEvent()?.status ?? (this.replay() ? 'IDLE' : '-'));
  readonly lastEvalLatency = computed(() => {
    const payload = this.replayEvent()?.payload;
    return this.formatDisplayValue(this.pickValue(payload, ['lastEvalMs', 'evaluationMs', 'latencyMs', 'elapsedMs']));
  });
  readonly chartEvaluationConfig = computed<EvaluationConfig>(() => {
    const runId = String(this.evaluateModel()['runId'] ?? '');
    return {
      enabled: runId.length > 0,
      runId,
      includeStrategy: true,
      includeTrace: false,
      debounceMs: 180,
      cacheEnabled: true
    };
  });
  readonly chartReplayState = computed<CandleChartReplayState>(() => ({
    index: this.resolveReplayIndex(),
    status: this.mapReplayStatus(this.replayEvent()?.status),
    speedMs: this.replaySpeed()
  }));
  readonly evaluateCurrentBar = (event: CandleChartBarChangedEvent): Observable<CandleChartEvaluationResult | null> | null => {
    const runId = String(this.evaluateModel()['runId'] ?? '');
    if (!runId) {
      return null;
    }
    const key = `${runId}:${event.index}`;
    const cached = this.evaluationCache.get(key);
    if (cached) {
      return of(cached);
    }
    const pending = this.pendingEvaluation.get(key);
    if (pending) {
      return pending;
    }
    const request$ = this.strategyDebugService.evaluateStrategy(runId, event.index).pipe(
      map((response) => response as CandleChartEvaluationResult),
      tap((result) => {
        if (result) {
          this.evaluationCache.set(key, result);
        }
      }),
      finalize(() => this.pendingEvaluation.delete(key)),
      shareReplay(1)
    );
    this.pendingEvaluation.set(key, request$);
    return request$;
  };
  readonly candleTableConfig: TableConfig = {
    title: 'tradeBot.replay.candles',
    columns: [
      { field: 'openTime', header: 'tradeBot.field.openTime', type: 'date', minWidth: '13rem' },
      { field: 'open', header: 'tradeBot.field.open', type: 'number' },
      { field: 'high', header: 'tradeBot.field.high', type: 'number' },
      { field: 'low', header: 'tradeBot.field.low', type: 'number' },
      { field: 'close', header: 'tradeBot.field.close', type: 'number' }
    ],
    pagination: true,
    rows: 25,
    minWidth: '68rem'
  };
  readonly overlayTableConfig: TableConfig = {
    title: 'tradeBot.replay.overlays',
    columns: [
      { field: 'name', header: 'tradeBot.field.name', type: 'copyable', minWidth: '16rem' },
      { field: 'count', header: 'tradeBot.field.count', type: 'number' },
      { field: 'raw', header: 'tradeBot.field.preview', type: 'json', minWidth: '24rem' }
    ],
    pagination: true,
    rows: 10,
    scrollable: true,
    minWidth: '56rem'
  };
  private readonly evaluationCache = new Map<string, CandleChartEvaluationResult>();
  private readonly pendingEvaluation = new Map<string, Observable<CandleChartEvaluationResult | null>>();

  constructor(
    private readonly service: ReplayService,
    private readonly strategyDebugService: StrategyDebugService,
    private readonly tradingSystemService: TradingSystemService,
    private readonly realtimeWebSocketService: RealtimeWebSocketService,
    private readonly loadingService: LoadingService,
    private readonly overlayMapper: CandleChartOverlayMapper,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService,
    private readonly destroyRef: DestroyRef
  ) {
    this.loadStrategyOptions();
    this.loadRunOptions();
  }

  initReplay(model: Record<string, unknown>): void {
    this.replayModel.set(model);
    let payload: ReplayInitDto;
    try {
      payload = {
        strategyCode: String(model['strategyCode'] ?? ''),
        symbol: String(model['symbol'] ?? ''),
        timeframe: String(model['timeframe'] ?? ''),
        source: optionalText(model['source']),
        marketType: optionalText(model['marketType']),
        feedCode: optionalText(model['feedCode']),
        fromTime: isoText(model['fromTime']),
        toTime: isoText(model['toTime']),
        overlayCodes: parseJson(model['overlayCodesText'], [])
      };
    } catch {
      this.toastService.error(this.i18nService.t('tradeBot.message.invalidJson'));
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.loadingService
      .track(this.service.initReplay(payload))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.clearEvaluationCache();
          this.evaluation.set(null);
          this.strategySignal.set(null);
          this.ruleTrace.set(null);
          this.replay.set(response);
          this.selectedCandle.set(this.chartCandles()[response.currentIndex] ?? this.chartCandles()[0] ?? null);
          this.error.set(null);
          this.watchReplay(response);
        },
        error: () => {
          const message = this.i18nService.t('tradeBot.message.loadFailed');
          this.error.set(message);
          this.toastService.error(message);
        }
      });
  }

  sendReplayCommand(commandType: ReplayCommandType, payload: Record<string, unknown> = {}): void {
    const sessionId = this.replay()?.sessionId;
    if (!sessionId) {
      return;
    }
    this.realtimeWebSocketService.sendReplayCommand(sessionId, commandType, payload);
  }

  playReplay(): void {
    this.sendReplayCommand('PLAY_REPLAY', {
      currentIndex: this.replay()?.currentIndex ?? 0,
      speedMs: this.replaySpeed()
    });
  }

  changeReplaySpeed(speedMs: number): void {
    this.replaySpeed.set(speedMs);
    this.sendReplayCommand('CHANGE_REPLAY_SPEED', { speedMs });
  }

  jumpReplay(index: number): void {
    this.sendReplayCommand('JUMP_TO_INDEX', { index });
  }

  onChartReplayCommand(command: CandleChartReplayCommand): void {
    switch (command.type) {
      case 'FIRST':
        this.jumpReplay(0);
        return;
      case 'PREVIOUS':
        this.sendReplayCommand('PREVIOUS_CANDLE');
        return;
      case 'PLAY':
        if (command.speedMs != null) {
          this.replaySpeed.set(command.speedMs);
        }
        this.sendReplayCommand('PLAY_REPLAY', {
          currentIndex: command.index ?? this.resolveReplayIndex(),
          speedMs: command.speedMs ?? this.replaySpeed()
        });
        return;
      case 'PAUSE':
        this.sendReplayCommand('PAUSE_REPLAY');
        return;
      case 'NEXT':
        this.sendReplayCommand('NEXT_CANDLE');
        return;
      case 'LAST':
        this.jumpReplay(Math.max((this.replay()?.candles?.length ?? 1) - 1, 0));
        return;
      case 'JUMP':
        this.jumpReplay(Number(command.index ?? this.resolveReplayIndex()));
        return;
      case 'SPEED':
        this.changeReplaySpeed(Number(command.speedMs ?? this.replaySpeed()));
        return;
    }
  }

  resetReplay(): void {
    this.replay.set(null);
    this.replayEvent.set(null);
    this.evaluation.set(null);
    this.strategySignal.set(null);
    this.ruleTrace.set(null);
    this.selectedCandle.set(null);
    this.clearEvaluationCache();
  }

  replayStatus(): string {
    return this.replayEvent()?.status ?? 'IDLE';
  }

  evaluateTrace(model: Record<string, unknown>): void {
    this.evaluate(model, true);
  }

  evaluateStrategy(model: Record<string, unknown>): void {
    this.evaluate(model, false);
  }

  onChartStrategySignal(signal: Record<string, unknown>): void {
    this.strategySignal.set(signal);
    this.evaluation.set({ ...(this.evaluation() ?? {}), strategy: signal });
  }

  onChartRuleEvaluated(trace: Record<string, unknown>): void {
    this.ruleTrace.set(trace);
    this.evaluation.set({ ...(this.evaluation() ?? {}), trace });
  }

  onChartCandleSelected(candle: ChartCandle): void {
    this.selectedCandle.set(candle);
    this.evaluateModel.set({ ...this.evaluateModel(), index: candle.index });
  }

  onChartError(): void {
    this.toastService.error(this.i18nService.t('tradeBot.message.evaluateFailed'));
  }

  private watchReplay(response: ReplayInitResponse): void {
    if (!response.sessionId) {
      return;
    }
    this.realtimeWebSocketService
      .subscribeReplay(response.sessionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.replayEvent.set(event);
        const index = Number(event.payload?.['index']);
        const current = this.replay();
        if (current && Number.isFinite(index)) {
          this.replay.set({ ...current, currentIndex: index });
          this.selectedCandle.set(this.chartCandles()[index] ?? this.selectedCandle());
        }
        if (event.payload) {
          this.evaluation.set(event.payload);
          this.syncEvaluationPanels(event.payload);
        }
      });
  }

  private resolveReplayIndex(): number {
    const payloadIndex = Number(this.replayEvent()?.payload?.['index']);
    if (Number.isFinite(payloadIndex)) {
      return payloadIndex;
    }
    return Number(this.replay()?.currentIndex ?? 0);
  }

  private mapReplayStatus(status: RealtimeTaskStatus | undefined): CandleChartStatus {
    switch (status) {
      case 'STARTED':
      case 'RUNNING':
      case 'PROGRESS':
      case 'RESUMED':
        return 'PLAYING';
      case 'PAUSED':
        return 'PAUSED';
      case 'COMPLETED':
      case 'SKIPPED':
        return 'ENDED';
      case 'FAILED':
      case 'CANCELLED':
      case 'WARNING':
        return 'ERROR';
      case 'IDLE':
      default:
        return this.replay() ? 'READY' : 'IDLE';
    }
  }

  private clearEvaluationCache(): void {
    this.evaluationCache.clear();
    this.pendingEvaluation.clear();
  }

  private syncEvaluationPanels(value: Record<string, unknown>): void {
    const strategy = this.overlayMapper.resolveStrategySignal(value);
    if (strategy) {
      this.strategySignal.set(strategy as Record<string, unknown>);
    }
    const trace = this.overlayMapper.resolveRuleTrace(value);
    if (trace) {
      this.ruleTrace.set(trace);
    }
  }

  private pickValue(record: Record<string, unknown> | null | undefined, keys: string[]): unknown {
    if (!record) {
      return null;
    }
    for (const key of keys) {
      const value = record[key];
      if (value != null && value !== '') {
        return value;
      }
    }
    return null;
  }

  private formatDisplayValue(value: unknown): string {
    if (value == null || value === '') {
      return '-';
    }
    if (typeof value === 'number') {
      return Number.isInteger(value) ? String(value) : value.toFixed(4);
    }
    return String(value);
  }

  private evaluate(model: Record<string, unknown>, trace: boolean): void {
    const runId = String(model['runId'] ?? '');
    const index = Number(model['index'] ?? 0);
    this.loading.set(true);
    this.error.set(null);
    const request = trace ? this.strategyDebugService.evaluateTrace(runId, index) : this.strategyDebugService.evaluateStrategy(runId, index);
    this.loadingService
      .track(request)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.evaluation.set(response);
          this.syncEvaluationPanels(response as Record<string, unknown>);
          this.error.set(null);
        },
        error: () => {
          const message = this.i18nService.t('tradeBot.message.evaluateFailed');
          this.error.set(message);
          this.toastService.error(message);
        }
      });
  }

  private loadStrategyOptions(): void {
    this.tradingSystemService
      .getStrategyConfigs({ status: 'ACTIVE' })
      .pipe(catchError(() => of([])))
      .subscribe((strategies) => {
        this.patchFormContextExtra({
          strategyOptions: strategies.map((strategy) => ({
            label: `${strategy.code} - ${strategy.strategyVersion}`,
            value: strategy.code
          }))
        });
      });
  }

  private loadRunOptions(): void {
    this.tradingSystemService
      .getBacktests()
      .pipe(catchError(() => of([] as BacktestRunResponse[])))
      .subscribe((runs) => {
        this.patchFormContextExtra({
          runOptions: runs
            .map((run) => {
              const runId = String(run.runId ?? '').trim();
              return runId
                ? {
                    label: `${runId} - ${run.strategyCode} / ${run.symbol} / ${run.status}`,
                    value: runId
                  }
                : null;
            })
            .filter((option): option is { label: string; value: string } => option !== null)
        });
      });
  }

  private patchFormContextExtra(extra: Record<string, unknown>): void {
    this.formContext = {
      ...this.formContext,
      extra: {
        ...this.formContext.extra,
        ...extra
      }
    };
  }
}

function optionalText(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function isoText(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value ?? '');
}
