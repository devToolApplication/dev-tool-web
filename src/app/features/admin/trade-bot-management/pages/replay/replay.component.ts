import { Component, DestroyRef, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, map, Observable, of } from 'rxjs';
import { BacktestRunResponse, ReplayInitDto, ReplayInitResponse } from '../../../../../core/models/trade-bot/trading-system.model';
import { RealtimeProgressEvent } from '../../../../../core/models/realtime/realtime.model';
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
  ChartCandle,
  ChartIndicator,
  EvaluationConfig,
  ReplayConfig
} from '../../shared-trading/candle-chart/candle-chart';
import { CandleChartOverlayMapper } from '../../shared-trading/candle-chart/candle-chart-overlay.mapper';
import { FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { EVALUATE_FORM, REPLAY_INIT_FORM } from '../../trade-bot-runtime.constants';
import { parseJson } from '../../trade-bot-form-utils';

@Component({
  selector: 'app-trade-bot-replay',
  standalone: false,
  templateUrl: './replay.component.html'
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
  readonly selectedCandle = signal<ChartCandle | null>(null);
  readonly replaySpeed = signal(650);
  readonly activeTab = signal('ruleTrace');
  readonly tabs: AppTabItem[] = [
    { label: 'tradeBot.replay.ruleTrace', value: 'ruleTrace' },
    { label: 'tradeBot.replay.candles', value: 'candles' },
    { label: 'tradeBot.replay.overlays', value: 'overlays' },
    { label: 'tradeBot.replay.rawEvents', value: 'rawEvents' }
  ];
  readonly chartConfig = computed<CandleChartConfig>(() => ({
    showCandles: true,
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
    evaluateOnBarChange: true
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
  readonly selectedCandleFacts = computed(() => {
    const candle = this.selectedCandle();
    return [
      { label: 'tradeBot.field.openTime', value: candle?.openTime ?? '-' },
      { label: 'tradeBot.field.open', value: candle?.open ?? '-' },
      { label: 'tradeBot.field.high', value: candle?.high ?? '-' },
      { label: 'tradeBot.field.low', value: candle?.low ?? '-' },
      { label: 'tradeBot.field.close', value: candle?.close ?? '-' },
      { label: 'tradeBot.field.volume', value: candle?.volume ?? '-' }
    ];
  });
  readonly overlayRows = computed(() =>
    Object.entries(this.replay()?.overlay?.overlays ?? {}).map(([name, value]) => ({
      name,
      count: Array.isArray(value) ? value.length : value && typeof value === 'object' ? Object.keys(value).length : value ? 1 : 0,
      raw: value
    }))
  );
  readonly evaluationTrace = computed<Record<string, unknown>>(() => {
    const evaluation = this.evaluation();
    return ((evaluation?.['ruleTrace'] ?? evaluation?.['trace'] ?? evaluation) as Record<string, unknown>) ?? {};
  });
  readonly chartEvaluationConfig = computed<EvaluationConfig>(() => {
    const runId = String(this.evaluateModel()['runId'] ?? '');
    return {
      enabled: runId.length > 0,
      runId,
      includeStrategy: true,
      includeTrace: false
    };
  });
  readonly evaluateCurrentBar = (event: CandleChartBarChangedEvent): Observable<CandleChartEvaluationResult | null> | null => {
    const runId = String(this.evaluateModel()['runId'] ?? '');
    if (!runId) {
      return null;
    }
    return this.strategyDebugService.evaluateStrategy(runId, event.index).pipe(map((response) => response as CandleChartEvaluationResult));
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

  resetReplay(): void {
    this.replay.set(null);
    this.replayEvent.set(null);
    this.evaluation.set(null);
    this.selectedCandle.set(null);
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
    this.evaluation.set(signal);
  }

  onChartRuleEvaluated(trace: Record<string, unknown>): void {
    this.evaluation.set(trace);
  }

  onChartCandleSelected(candle: ChartCandle): void {
    this.selectedCandle.set(candle);
    this.evaluateModel.set({ ...this.evaluateModel(), index: candle.index });
  }

  onChartError(): void {
    this.toastService.error(this.i18nService.t('tradeBot.message.evaluateFailed'));
  }

  replayJson(): unknown {
    return this.replay()?.overlay?.overlays ?? {};
  }

  evaluationJson(): unknown {
    return this.evaluation() ?? {};
  }

  replayEventJson(): RealtimeProgressEvent | null {
    return this.replayEvent();
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
        }
      });
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
