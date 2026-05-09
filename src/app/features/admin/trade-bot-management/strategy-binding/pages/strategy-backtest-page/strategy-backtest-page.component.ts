import {
  ChangeDetectorRef,
  Component,
  EffectRef,
  NgZone,
  OnDestroy,
  OnInit,
  effect,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of, Subscription, switchMap } from 'rxjs';
import { TableConfig } from '../../../../../../shared/ui/table/models/table-config.model';
import {
  CandleData,
  CandleChartConfig,
  CandleChartPayload,
  ChartBoxArea,
  ChartIndicatorSeries,
  ChartLine,
  ChartPoint,
} from '../../../../../../shared/component/candle-chart/candle-chart';
import {
  BacktestJobResponse,
  BacktestMetricResponse,
  BacktestOrderResponse,
  BacktestRunDto,
} from '../../../../../../core/models/trade-bot/backtest.model';
import {
  TradeBotAreaData,
  TradeBotChartResponse,
  TradeBotCandleResponse,
  TradeBotIndicatorData,
  TradeBotLineData,
  TradeBotOverlayResponse,
  TradeBotPointData,
  TradeSignalStreamResponse,
} from '../../../../../../core/models/trade-bot/chart-query.model';
import {
  ReplayStepEvent,
  ReplayTradeTimelineItem,
  StrategyReplayEventType,
  StrategyReplayPayload,
} from '../../../../../../core/models/trade-bot/strategy-replay.model';
import { TradeStrategyBindingResponse } from '../../../../../../core/models/trade-bot/trade-strategy-binding.model';
import { BacktestService } from '../../../../../../core/services/trade-bot-service/backtest.service';
import {
  ChartQueryService,
  TradeRuleOverlayWsSession,
} from '../../../../../../core/services/trade-bot-service/chart-query.service';
import { TradeStrategyBindingService } from '../../../../../../core/services/trade-bot-service/trade-strategy-binding.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { STRATEGY_MANAGEMENT_ROUTES } from '../../strategy-management.constants';
import { StrategyReplayFacade } from '../../replay/strategy-replay.facade';
import { buildChartReplayPayload } from '../../replay/strategy-replay-chart.builder';
import {
  REPLAY_EVENT_LEGEND_ITEMS,
  ReplayEventLegendItem,
  replayEventChartShape,
  replayEventColor,
  replayEventLabel,
  replayEventMarkerClasses,
  replayEventMarkerSize,
} from '../../replay/strategy-replay-event-visuals';
import {
  BACKTEST_RISK_MODE_OPTIONS,
  BacktestRiskMode,
  STRATEGY_TIMEFRAME_OPTIONS,
  StrategyTimeframe,
  TradeBotTextKey,
} from '../../shared/strategy-ui.enums';

type BacktestRunFormGroup = FormGroup<{
  fromDate: FormControl<Date | null>;
  toDate: FormControl<Date | null>;
  initialBalance: FormControl<number>;
  feeRate: FormControl<number>;
  slippageRate: FormControl<number>;
  riskMode: FormControl<BacktestRiskMode>;
  fixedRiskAmount: FormControl<number>;
  riskPercentPerTrade: FormControl<number>;
}>;

const REPLAY_PREVIEW_LINE_LIMIT = 18;
const REPLAY_PREVIEW_AREA_LIMIT = 10;
const REPLAY_PREVIEW_POINT_LIMIT = 24;
const DEFAULT_REPLAY_TIMEFRAME = StrategyTimeframe.M15;
const RULE_PREVIEW_SYNC_DELAY_MS = 80;

type ChartOverlayKind = 'line' | 'area' | 'point' | 'indicator';
type ChartOverlayOption = { kind: ChartOverlayKind; label: string; value: string };

@Component({
  selector: 'app-strategy-backtest-page',
  standalone: false,
  providers: [StrategyReplayFacade],
  templateUrl: './strategy-backtest-page.component.html',
  styleUrl: './strategy-backtest-page.component.css',
})
export class StrategyBacktestPageComponent implements OnInit, OnDestroy {
  readonly TEXT = TradeBotTextKey;
  readonly riskModes = BacktestRiskMode;
  readonly riskModeOptions = BACKTEST_RISK_MODE_OPTIONS;
  readonly eventLegendItems = REPLAY_EVENT_LEGEND_ITEMS;
  readonly chartTimeframeOptions = STRATEGY_TIMEFRAME_OPTIONS;
  readonly chartViewTimeframe = signal<StrategyTimeframe>(DEFAULT_REPLAY_TIMEFRAME);
  readonly chartViewLoading = signal(false);
  readonly selectedChartOverlayKeys = signal<string[]>([]);
  readonly rulePreviewSyncing = signal(false);
  chartOverlayOptions: ChartOverlayOption[] = [];
  chartConfig: CandleChartConfig = {
    showCandles: true,
    showVolume: true,
    showLines: true,
    showBoxAreas: true,
    showPoints: true,
    showIndicators: true,
    showOverlayLabels: true,
    showPriceAxisLabels: false,
  };

  readonly orderTableConfig: TableConfig = {
    title: TradeBotTextKey.BacktestOrders,
    columns: [
      { field: 'nyTradeDate', header: TradeBotTextKey.TradeDate, sortable: true },
      { field: 'orderSide', header: TradeBotTextKey.Side, sortable: true },
      {
        field: 'entryPrice',
        header: TradeBotTextKey.EntryPrice,
        sortable: true,
        type: 'number',
        format: '1.2-6',
        suffix: 'USD',
        minWidth: '10rem',
      },
      {
        field: 'stopLoss',
        header: 'SL',
        sortable: true,
        type: 'number',
        format: '1.2-6',
        suffix: 'USD',
        minWidth: '10rem',
      },
      {
        field: 'takeProfit',
        header: 'TP',
        sortable: true,
        type: 'number',
        format: '1.2-6',
        suffix: 'USD',
        minWidth: '10rem',
      },
      {
        field: 'exitPrice',
        header: TradeBotTextKey.ExitPrice,
        sortable: true,
        type: 'number',
        format: '1.2-6',
        suffix: 'USD',
        minWidth: '10rem',
      },
      {
        field: 'grossPnl',
        header: TradeBotTextKey.GrossPnl,
        sortable: true,
        type: 'number',
        format: '1.2-6',
        suffix: 'USD',
        minWidth: '10rem',
      },
      {
        field: 'feePaid',
        header: TradeBotTextKey.FeePaid,
        sortable: true,
        type: 'number',
        format: '1.2-6',
        suffix: 'USD',
        minWidth: '10rem',
      },
      {
        field: 'slippagePaid',
        header: TradeBotTextKey.SlippagePaid,
        sortable: true,
        type: 'number',
        format: '1.2-6',
        suffix: 'USD',
        minWidth: '10rem',
      },
      {
        field: 'netPnl',
        header: TradeBotTextKey.NetPnl,
        sortable: true,
        type: 'number',
        format: '1.2-6',
        suffix: 'USD',
        minWidth: '10rem',
      },
      { field: 'result', header: TradeBotTextKey.Result, sortable: true },
      { field: 'exitReason', header: TradeBotTextKey.ExitReason, sortable: true },
    ],
    pagination: true,
    scrollHeight: '28rem',
    minWidth: '110rem',
    rows: 20,
    rowsPerPageOptions: [10, 20, 50, 100],
  };

  binding: TradeStrategyBindingResponse | null = null;
  job: BacktestJobResponse | null = null;
  metric: BacktestMetricResponse | null = null;
  orders: BacktestOrderResponse[] = [];
  replayPayload: StrategyReplayPayload | null = null;
  previewChartData: TradeBotChartResponse | null = null;
  running = false;
  loadingOrders = false;
  private readonly subscriptions = new Subscription();
  private replayChartTimeframe = DEFAULT_REPLAY_TIMEFRAME;
  private chartViewData: TradeBotCandleResponse | null = null;
  private chartViewDataVersion = 0;
  private chartViewRequestKey = '';
  private chartPayloadCacheKey = '';
  private chartPayloadCache: CandleChartPayload = this.emptyChartPayload();
  private readonly hiddenChartOverlayKeys = new Set<string>();
  private rulePreviewWsSession: TradeRuleOverlayWsSession | null = null;
  private rulePreviewSyncEffect?: EffectRef;
  private rulePreviewSyncTimeoutId: number | null = null;
  private rulePreviewInFlightRequestId = '';
  private pendingRulePreviewSync = false;
  private rulePreviewRequestSeq = 0;

  readonly runForm: BacktestRunFormGroup = new FormGroup({
    fromDate: new FormControl(this.toDateOffset(-30), { validators: [Validators.required] }),
    toDate: new FormControl(this.toDateOffset(0), { validators: [Validators.required] }),
    initialBalance: new FormControl(10_000, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    feeRate: new FormControl(0.0005, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    slippageRate: new FormControl(0.0002, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    riskMode: new FormControl<BacktestRiskMode>(BacktestRiskMode.EQUITY_PERCENT, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    fixedRiskAmount: new FormControl(100, { nonNullable: true }),
    riskPercentPerTrade: new FormControl(1, { nonNullable: true }),
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly bindingService: TradeStrategyBindingService,
    private readonly backtestService: BacktestService,
    private readonly chartQueryService: ChartQueryService,
    private readonly i18nService: I18nService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly ngZone: NgZone,
    private readonly changeDetectorRef: ChangeDetectorRef,
    readonly replay: StrategyReplayFacade,
  ) {
    this.rulePreviewSyncEffect = effect(() => {
      const stepIndex = this.replay.currentStepIndex();
      const payload = this.replay.payload();
      if (!payload || !this.job || !this.binding) {
        return;
      }

      queueMicrotask(() => this.scheduleRulePreviewSync());
    });
  }

  ngOnInit(): void {
    this.syncRiskValidators();
    this.subscriptions.add(
      this.runForm.controls.riskMode.valueChanges.subscribe(() => this.syncRiskValidators()),
    );

    const bindingId = this.route.snapshot.paramMap.get('id');
    if (!bindingId) {
      void this.router.navigate([STRATEGY_MANAGEMENT_ROUTES.list]);
      return;
    }

    this.loadingService.track(this.bindingService.getById(bindingId)).subscribe({
      next: (binding) => {
        this.binding = binding;
        this.applyBacktestDefaults(binding);

        const jobId = this.route.snapshot.queryParamMap.get('jobId');
        if (jobId) {
          this.loadReplayJob(jobId);
        }
      },
      error: () => {
        this.toastService.error(this.i18nService.t(TradeBotTextKey.LoadBindingFailed));
        void this.router.navigate([STRATEGY_MANAGEMENT_ROUTES.list]);
      },
    });
  }

  ngOnDestroy(): void {
    this.rulePreviewSyncEffect?.destroy();
    this.clearRulePreviewSyncTimer();
    this.closeRulePreviewSession();
    this.subscriptions.unsubscribe();
    this.replay.destroy();
  }

  get currentStepLabel(): string {
    const step = this.replay.currentStep();
    return step
      ? `${this.i18nService.t(TradeBotTextKey.Step)} ${step.index + 1} / ${this.replay.steps().length}`
      : '--';
  }

  get currentRules() {
    return this.replay.currentStep()?.ruleExplanations ?? [];
  }

  get visibleEventLegendItems(): ReplayEventLegendItem[] {
    const visibleTypes = new Set(this.replay.events().map((event) => event.type));
    return this.eventLegendItems.filter(
      (item) => visibleTypes.size === 0 || visibleTypes.has(item.type),
    );
  }

  get chartPayload(): CandleChartPayload {
    const currentStepIndex = this.replay.currentStepIndex();
    const steps = this.replay.steps().slice(0, currentStepIndex + 1);
    const visibleStartTime = steps[0]?.candleTime;
    const visibleEndTime = this.replay.currentStep()?.candleTime ?? steps.at(-1)?.candleTime;
    const activeOverlays = this.replay.activeOverlaySlice();
    const visibleEvents = this.replay
      .events()
      .filter((event) => event.stepIndex <= currentStepIndex);
    const cacheKey = [
      currentStepIndex,
      steps.length,
      activeOverlays.length,
      visibleEvents.length,
      this.replay.trades().length,
      this.chartViewTimeframe(),
      this.chartViewDataVersion,
      this.previewChartData?.lineData?.length ?? 0,
      this.previewChartData?.areaData?.length ?? 0,
      this.previewChartData?.pointData?.length ?? 0,
      this.previewChartData?.indicatorData?.length ?? 0,
      this.selectedChartOverlayKeys().join(','),
    ].join('|');

    if (cacheKey === this.chartPayloadCacheKey) {
      return this.chartPayloadCache;
    }

    this.chartPayloadCacheKey = cacheKey;
    this.chartPayloadCache = {
      candles: this.toChartCandles(visibleStartTime, visibleEndTime, steps),
      lines: [
        ...activeOverlays
          .filter((overlay) =>
            ['entry', 'stop-loss', 'take-profit', 'indicator-line', 'bos', 'choch'].includes(
              overlay.type,
            ),
          )
          .map((overlay) => this.toChartLine(overlay.payload, overlay.label)),
        ...this.toPreviewLines(visibleStartTime, visibleEndTime),
      ],
      boxAreas: [
        ...activeOverlays
          .filter((overlay) =>
            ['session-zone', 'area-zone', 'order-block', 'fvg', 'liquidity'].includes(overlay.type),
          )
          .map((overlay) => this.toChartBoxArea(overlay.payload, overlay.label)),
        ...this.toPreviewAreas(visibleStartTime, visibleEndTime),
      ],
      points: [
        ...this.toPreviewPoints(visibleStartTime, visibleEndTime),
        ...visibleEvents.map((event) => this.toChartPoint(event)),
      ],
      indicators: this.shouldRenderPreviewIndicators()
        ? this.toPreviewIndicators(0, steps.length)
        : [],
    };

    return this.chartPayloadCache;
  }

  goBack(): void {
    void this.router.navigate([STRATEGY_MANAGEMENT_ROUTES.list]);
  }

  runBacktest(): void {
    if (!this.binding) {
      return;
    }

    this.runForm.markAllAsTouched();
    if (this.runForm.invalid) {
      this.toastService.info(this.i18nService.t(TradeBotTextKey.ReviewBacktestBeforeRun));
      return;
    }

    const payload = this.buildRunPayload(this.binding);
    this.running = true;
    this.loadingService
      .track(this.backtestService.run(payload))
      .pipe(finalize(() => (this.running = false)))
      .subscribe({
        next: (job) => {
          this.toastService.success(this.i18nService.t(TradeBotTextKey.RunBacktestSuccess));
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { jobId: job.id },
            queryParamsHandling: 'merge',
          });
          this.loadReplayJob(job.id);
        },
        error: () => this.toastService.error(this.i18nService.t(TradeBotTextKey.RunBacktestFailed)),
      });
  }

  onTradeSelected(trade: ReplayTradeTimelineItem): void {
    this.replay.jumpToTrade(trade.id);
  }

  onEventSelected(event: ReplayStepEvent): void {
    this.replay.jumpToEvent(event.id);
  }

  onChartTimeframeChange(value: string | number | boolean | null): void {
    const nextTimeframe = this.toStrategyTimeframe(value, this.chartViewTimeframe());
    if (nextTimeframe === this.chartViewTimeframe() && this.chartViewData) {
      return;
    }

    const previousTimeframe = this.chartViewTimeframe();
    this.chartViewTimeframe.set(nextTimeframe);
    this.updateChartConfig();
    this.loadChartViewData(nextTimeframe, previousTimeframe);
  }

  onChartOverlaySelectionChange(value: Array<string | number> | null): void {
    const selectedValues = new Set((value ?? []).map((item) => String(item)));
    this.hiddenChartOverlayKeys.clear();
    this.chartOverlayOptions.forEach((option) => {
      if (!selectedValues.has(option.value)) {
        this.hiddenChartOverlayKeys.add(option.value);
      }
    });
    this.selectedChartOverlayKeys.set(
      this.chartOverlayOptions
        .map((option) => option.value)
        .filter((key) => !this.hiddenChartOverlayKeys.has(key)),
    );
    this.resetChartPayloadCache();
  }

  toggleChartOverlay(value: string): void {
    if (this.hiddenChartOverlayKeys.has(value)) {
      this.hiddenChartOverlayKeys.delete(value);
    } else {
      this.hiddenChartOverlayKeys.add(value);
    }

    this.selectedChartOverlayKeys.set(
      this.chartOverlayOptions
        .map((option) => option.value)
        .filter((key) => !this.hiddenChartOverlayKeys.has(key)),
    );
    this.resetChartPayloadCache();
  }

  isChartOverlaySelected(value: string): boolean {
    return this.selectedChartOverlayKeys().includes(value);
  }

  eventLabel(type: StrategyReplayEventType): string {
    return replayEventLabel(type);
  }

  eventMarkerClasses(type: StrategyReplayEventType): string[] {
    return replayEventMarkerClasses(type);
  }

  private ensureRulePreviewSession(): TradeRuleOverlayWsSession | null {
    if (this.rulePreviewWsSession) {
      return this.rulePreviewWsSession;
    }

    const session = this.chartQueryService.createRuleOverlayStream();
    this.rulePreviewWsSession = session;
    this.subscriptions.add(
      session.responses$.subscribe({
        next: (response) => this.ngZone.run(() => this.handleRulePreviewResponse(response)),
        error: () => {
          this.ngZone.run(() => {
            this.rulePreviewWsSession?.close();
            this.rulePreviewWsSession = null;
            this.rulePreviewSyncing.set(false);
            this.rulePreviewInFlightRequestId = '';
            this.pendingRulePreviewSync = false;
            this.toastService.error(this.i18nService.t('tradeBot.websocketDisconnected'));
          });
        },
      }),
    );
    return session;
  }

  private closeRulePreviewSession(): void {
    this.rulePreviewWsSession?.close();
    this.rulePreviewWsSession = null;
    this.rulePreviewSyncing.set(false);
    this.rulePreviewInFlightRequestId = '';
    this.pendingRulePreviewSync = false;
  }

  private scheduleRulePreviewSync(): void {
    if (this.rulePreviewInFlightRequestId) {
      this.pendingRulePreviewSync = true;
      return;
    }

    this.clearRulePreviewSyncTimer();
    this.rulePreviewSyncTimeoutId = window.setTimeout(() => {
      this.rulePreviewSyncTimeoutId = null;
      this.requestRulePreviewForCurrentStep();
    }, RULE_PREVIEW_SYNC_DELAY_MS);
  }

  private clearRulePreviewSyncTimer(): void {
    if (this.rulePreviewSyncTimeoutId == null) {
      return;
    }

    window.clearTimeout(this.rulePreviewSyncTimeoutId);
    this.rulePreviewSyncTimeoutId = null;
  }

  private requestRulePreviewForCurrentStep(): void {
    if (!this.job || !this.binding) {
      return;
    }

    const currentStep = this.replay.currentStep();
    if (!currentStep) {
      return;
    }

    const session = this.ensureRulePreviewSession();
    if (!session) {
      return;
    }

    const job = this.job;
    const dataResource = this.resolveDataResource(job.exchangeCode);
    const startTime = this.resolveRulePreviewStartTime(job, this.orders);
    const resultStartTime = this.resolveReplayStartTime(job, this.orders);
    const endTime = currentStep.candleTime;
    if (endTime < startTime) {
      return;
    }

    if (this.rulePreviewInFlightRequestId) {
      this.pendingRulePreviewSync = true;
      return;
    }

    const requestId = `${job.id}-${currentStep.index}-${++this.rulePreviewRequestSeq}`;
    this.rulePreviewInFlightRequestId = requestId;
    this.pendingRulePreviewSync = false;
    this.rulePreviewSyncing.set(true);
    session.send({
      requestId,
      dataResource,
      symbol: job.providerSymbol || job.symbolCode,
      interval: this.toIntervalKey(this.replayChartTimeframe, dataResource),
      startTime,
      endTime,
      resultStartTime,
      strategyServiceName: this.binding.strategyServiceName ?? job.strategyServiceName,
      configJson: this.resolveRulePreviewConfig(job),
      showAreaLabels: true,
    });
  }

  private handleRulePreviewResponse(response: TradeSignalStreamResponse): void {
    if (response.requestId !== this.rulePreviewInFlightRequestId) {
      return;
    }

    this.rulePreviewInFlightRequestId = '';
    if (!response.errorMessage && response.data) {
      this.previewChartData = this.mergeRulePreviewData(this.previewChartData, response.data);
      this.syncChartOverlayOptions(this.previewChartData);
      this.chartViewDataVersion++;
      this.resetChartPayloadCache();
    }

    if (this.pendingRulePreviewSync) {
      this.pendingRulePreviewSync = false;
      this.scheduleRulePreviewSync();
    } else {
      this.rulePreviewSyncing.set(false);
    }

    this.changeDetectorRef.markForCheck();
  }

  private mergeRulePreviewData(
    current: TradeBotChartResponse | null,
    next: TradeBotOverlayResponse,
  ): TradeBotChartResponse {
    return {
      candlestickData: current?.candlestickData ?? [],
      lineData: next.lineData ?? [],
      areaData: next.areaData ?? [],
      pointData: next.pointData ?? [],
      indicatorData: next.indicatorData ?? [],
    };
  }

  private loadReplayJob(jobId: string): void {
    if (!this.binding) {
      return;
    }
    const binding = this.binding;

    this.clearRulePreviewSyncTimer();
    this.closeRulePreviewSession();
    this.hiddenChartOverlayKeys.clear();
    this.chartOverlayOptions = [];
    this.selectedChartOverlayKeys.set([]);
    this.loadingOrders = true;
    this.loadingService
      .track(
        forkJoin({
          job: this.backtestService.getById(jobId),
          metric: this.backtestService.getMetrics(jobId).pipe(catchError(() => of(null))),
          orders: this.backtestService
            .getOrders(jobId, 0, 500, ['entryTime,asc'])
            .pipe(catchError(() => of({ data: [], metadata: null } as any))),
        }).pipe(
          switchMap(({ job, metric, orders }) => {
            const previewConfig = job.configJson ?? binding.configJson ?? {};
            const dataResource = this.resolveDataResource(job.exchangeCode);
            const replayTimeframe = this.resolveReplayTimeframe(previewConfig);
            return this.chartQueryService
              .getCandle(
                job.providerSymbol || job.symbolCode,
                this.toIntervalKey(replayTimeframe, dataResource),
                this.resolveReplayStartTime(job, orders.data ?? []),
                this.resolveReplayEndTime(job, orders.data ?? []),
                dataResource,
              )
              .pipe(
                catchError(() => of({ candlestickData: [] })),
                switchMap((chartData) =>
                  of({
                    job,
                    metric,
                    orders,
                    chartData,
                    replayTimeframe,
                    replay: buildChartReplayPayload(job, chartData, orders.data ?? [], metric),
                  }),
                ),
              );
          }),
        ),
      )
      .pipe(finalize(() => (this.loadingOrders = false)))
      .subscribe({
        next: ({ job, metric, orders, chartData, replay, replayTimeframe }) => {
          this.job = job;
          this.metric = metric;
          this.orders = orders.data ?? [];
          this.previewChartData = chartData;
          this.syncChartOverlayOptions(chartData);
          this.replayChartTimeframe = replayTimeframe;
          this.chartViewTimeframe.set(replayTimeframe);
          this.chartViewData = chartData;
          this.chartViewDataVersion++;
          this.chartViewRequestKey = '';
          this.chartViewLoading.set(false);
          this.updateChartConfig(job, replayTimeframe);
          this.replayPayload = replay;
          this.resetChartPayloadCache();
          this.replay.setPayload(this.replayPayload);
          this.ensureRulePreviewSession();
          this.scheduleRulePreviewSync();
        },
        error: () => this.toastService.error(this.i18nService.t(TradeBotTextKey.LoadReplayFailed)),
      });
  }

  private buildRunPayload(binding: TradeStrategyBindingResponse): BacktestRunDto {
    const formValue = this.runForm.getRawValue();
    return {
      bindingId: binding.id,
      exchangeId: binding.exchangeId ?? '',
      symbolId: binding.symbolId ?? '',
      strategyId: binding.strategyId ?? '',
      marketType: binding.marketType,
      tradeSideMode: binding.tradeSideMode,
      fromDate: this.formatDate(formValue.fromDate),
      toDate: this.formatDate(formValue.toDate),
      initialBalance: formValue.initialBalance,
      feeRate: formValue.feeRate,
      slippageRate: formValue.slippageRate,
      riskConfig: this.buildRiskConfig(formValue),
    };
  }

  private buildRiskConfig(formValue: BacktestRunFormGroup['value']): Record<string, unknown> {
    if (formValue.riskMode === BacktestRiskMode.FIXED_AMOUNT) {
      return {
        riskMode: BacktestRiskMode.FIXED_AMOUNT,
        fixedRiskAmount: Number(formValue.fixedRiskAmount ?? 0),
      };
    }

    return {
      riskMode: BacktestRiskMode.EQUITY_PERCENT,
      riskPercentPerTrade: Number(formValue.riskPercentPerTrade ?? 0),
    };
  }

  private applyBacktestDefaults(binding: TradeStrategyBindingResponse): void {
    const tradeManagementRule = this.findSelectedRuleConfig(
      binding,
      'TRADE_MANAGEMENT_RULE',
      'TRADE_MANAGEMENT',
    );
    const defaults = (tradeManagementRule?.['backtest_defaults'] as
      | Record<string, unknown>
      | undefined) ?? {
      initialBalance: tradeManagementRule?.['backtest_initial_balance'],
      feeRate: tradeManagementRule?.['backtest_fee_rate'],
      slippageRate: tradeManagementRule?.['backtest_slippage_rate'],
      fixedRiskAmount: tradeManagementRule?.['backtest_fixed_risk_amount'],
      riskPercentPerTrade: tradeManagementRule?.['backtest_risk_per_trade_pct'],
    };
    const hasFixedRiskDefault = defaults['fixedRiskAmount'] != null;
    const hasPercentRiskDefault =
      defaults['riskPercentPerTrade'] != null || defaults['riskPerTradePct'] != null;
    const fixedRiskAmount = Number(defaults['fixedRiskAmount'] ?? 100);
    const riskPercentPerTrade = Number(
      defaults['riskPercentPerTrade'] ?? defaults['riskPerTradePct'] ?? 1,
    );
    this.runForm.patchValue({
      initialBalance: Number(defaults['initialBalance'] ?? 10_000),
      feeRate: Number(defaults['feeRate'] ?? 0.0005),
      slippageRate: Number(defaults['slippageRate'] ?? 0.0002),
      riskMode:
        hasFixedRiskDefault && !hasPercentRiskDefault
          ? BacktestRiskMode.FIXED_AMOUNT
          : BacktestRiskMode.EQUITY_PERCENT,
      fixedRiskAmount,
      riskPercentPerTrade,
    });
  }

  private syncRiskValidators(): void {
    const fixedRiskAmount = this.runForm.controls.fixedRiskAmount;
    const riskPercentPerTrade = this.runForm.controls.riskPercentPerTrade;

    if (this.runForm.controls.riskMode.value === BacktestRiskMode.FIXED_AMOUNT) {
      fixedRiskAmount.setValidators([Validators.required, Validators.min(0.01)]);
      riskPercentPerTrade.clearValidators();
    } else {
      riskPercentPerTrade.setValidators([Validators.required, Validators.min(0.01)]);
      fixedRiskAmount.clearValidators();
    }

    fixedRiskAmount.updateValueAndValidity({ emitEvent: false });
    riskPercentPerTrade.updateValueAndValidity({ emitEvent: false });
  }

  private findSelectedRuleConfig(
    binding: TradeStrategyBindingResponse,
    slotCode: string,
    ruleCode: string,
  ): Record<string, unknown> | undefined {
    return binding.selectedRules?.find(
      (item) =>
        item.slotCode?.toUpperCase() === slotCode || item.ruleCode?.toUpperCase() === ruleCode,
    )?.configJson;
  }

  private toChartLine(payload: Record<string, unknown>, fallbackName: string): ChartLine {
    return {
      name: String(payload['label'] ?? fallbackName),
      color: String(payload['color'] ?? 'var(--app-chart-primary)'),
      start: Number(payload['start'] ?? 0),
      end: Number(payload['end'] ?? payload['start'] ?? 0),
      startTime: String(payload['startTime'] ?? ''),
      endTime: String(payload['endTime'] ?? payload['startTime'] ?? ''),
    };
  }

  private toChartBoxArea(payload: Record<string, unknown>, fallbackName: string): ChartBoxArea {
    return {
      name: String(payload['label'] ?? fallbackName),
      color: String(payload['color'] ?? 'var(--app-chart-primary-fill)'),
      startTime: String(payload['startTime'] ?? ''),
      endTime: String(payload['endTime'] ?? payload['startTime'] ?? ''),
      high: Number(payload['high'] ?? 0),
      low: Number(payload['low'] ?? 0),
    };
  }

  private toChartPoint(event: ReplayStepEvent): ChartPoint {
    const trade = this.replay.trades().find((item) => item.id === event.tradeId);
    const price =
      event.type === 'order-placed'
        ? trade?.entryPrice
        : event.type === 'tp-hit'
          ? trade?.takeProfit
          : event.type === 'sl-hit'
            ? trade?.stopLoss
            : (trade?.exitPrice ??
              trade?.entryPrice ??
              this.replay.currentStep()?.candle.close ??
              0);

    return {
      name: event.title,
      color: replayEventColor(event.type),
      shape: replayEventChartShape(event.type, trade?.side),
      startTime: new Date(event.candleTime).toISOString(),
      price: Number(price ?? 0),
      size: replayEventMarkerSize(event.type),
    };
  }

  private toPreviewIndicators(
    startStepIndex: number,
    endStepIndex: number,
  ): ChartIndicatorSeries[] {
    return (this.previewChartData?.indicatorData ?? [])
      .filter((indicator: TradeBotIndicatorData) =>
        this.isChartOverlayVisible('indicator', indicator.name),
      )
      .map((indicator: TradeBotIndicatorData) => ({
        name: indicator.name ?? 'Indicator',
        color: indicator.color ?? 'var(--app-chart-violet)',
        pane: indicator.type === 'SUBCHART' ? 'subchart' : 'overlay',
        values: (indicator.value ?? [])
          .slice(startStepIndex, endStepIndex)
          .map((value: number | null) => (value == null ? null : Number(value))),
      }));
  }

  private toChartCandles(
    visibleStartTime: number | undefined,
    visibleEndTime: number | undefined,
    fallbackSteps: Array<{ candle: CandleData }>,
  ): CandleData[] {
    const chartCandles = this.chartViewData?.candlestickData ?? [];
    if (chartCandles.length === 0) {
      return fallbackSteps.map((step) => step.candle);
    }

    const startTime = visibleStartTime ?? Number.NEGATIVE_INFINITY;
    const endTime = visibleEndTime ?? Number.POSITIVE_INFINITY;
    return chartCandles
      .filter((candle) => candle.utcTimeStamp >= startTime && candle.utcTimeStamp <= endTime)
      .map((candle) => ({
        time: this.toIsoTime(candle.utcTimeStamp),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      }));
  }

  private shouldRenderPreviewIndicators(): boolean {
    return this.chartViewTimeframe() === this.replayChartTimeframe;
  }

  private toPreviewLines(visibleStartTime?: number, visibleEndTime?: number): ChartLine[] {
    if (visibleStartTime == null || visibleEndTime == null) {
      return [];
    }
    const visibleLines = this.limitNewestByTime(
      (this.previewChartData?.lineData ?? [])
        .filter((item: TradeBotLineData) => item.from && item.to)
        .filter((item: TradeBotLineData) => this.isChartOverlayVisible('line', item.name))
        .filter((item: TradeBotLineData) =>
          this.rangeOverlaps(item.from?.time, item.to?.time, visibleStartTime, visibleEndTime),
        ),
      (item: TradeBotLineData) => item.to?.time ?? item.from?.time ?? 0,
      REPLAY_PREVIEW_LINE_LIMIT,
    );
    return visibleLines.flatMap((item: TradeBotLineData) => {
      const startTime = Math.max(item.from?.time ?? visibleStartTime, visibleStartTime);
      const endTime = Math.min(item.to?.time ?? visibleEndTime, visibleEndTime);
      if (endTime < startTime) {
        return [];
      }

      return [
        {
          name: this.compactPreviewLabel(item.name ?? 'Line'),
          color: item.color ?? 'var(--app-chart-info)',
          start: Number(item.from?.value ?? 0),
          end: Number(item.to?.value ?? item.from?.value ?? 0),
          startTime: this.toIsoTime(startTime),
          endTime: this.toIsoTime(endTime),
        },
      ];
    });
  }

  private toPreviewAreas(visibleStartTime?: number, visibleEndTime?: number): ChartBoxArea[] {
    if (visibleStartTime == null || visibleEndTime == null) {
      return [];
    }
    const visibleAreas = this.limitNewestByTime(
      (this.previewChartData?.areaData ?? [])
        .filter(
          (item: TradeBotAreaData) =>
            item.from != null && item.to != null && item.maxPrice != null && item.minPrice != null,
        )
        .filter((item: TradeBotAreaData) => this.isChartOverlayVisible('area', item.name))
        .filter((item: TradeBotAreaData) =>
          this.rangeOverlaps(item.from, item.to, visibleStartTime, visibleEndTime),
        ),
      (item: TradeBotAreaData) => item.to ?? item.from ?? 0,
      REPLAY_PREVIEW_AREA_LIMIT,
    );
    return visibleAreas.flatMap((item: TradeBotAreaData) => {
      const startTime = Math.max(item.from ?? visibleStartTime, visibleStartTime);
      const endTime = Math.min(item.to ?? visibleEndTime, visibleEndTime);
      if (endTime < startTime) {
        return [];
      }

      return [
        {
          ...(item.name ? { name: this.compactPreviewLabel(item.name) } : {}),
          color: item.color ?? 'var(--app-chart-primary-fill)',
          startTime: this.toIsoTime(startTime),
          endTime: this.toIsoTime(endTime),
          high: Number(item.maxPrice ?? 0),
          low: Number(item.minPrice ?? 0),
        },
      ];
    });
  }

  private toPreviewPoints(visibleStartTime?: number, visibleEndTime?: number): ChartPoint[] {
    if (visibleStartTime == null || visibleEndTime == null) {
      return [];
    }
    const visiblePoints = this.limitNewestByTime(
      (this.previewChartData?.pointData ?? [])
        .filter((item: TradeBotPointData) => this.isChartOverlayVisible('point', item.name))
        .filter(
          (item: TradeBotPointData) => item.time >= visibleStartTime && item.time <= visibleEndTime,
        ),
      (item: TradeBotPointData) => item.time,
      REPLAY_PREVIEW_POINT_LIMIT,
    );
    return visiblePoints.map((item: TradeBotPointData) => ({
      name: this.compactPreviewLabel(item.name ?? 'Point'),
      color: item.color ?? 'var(--app-chart-warning)',
      shape: item.shape,
      startTime: this.toIsoTime(item.time),
      price: Number(item.value),
      size: this.resolvePreviewPointSize(item.name),
    }));
  }

  private syncChartOverlayOptions(
    chartData: TradeBotChartResponse | TradeBotOverlayResponse | null,
  ): void {
    const previousValues = new Set(this.chartOverlayOptions.map((option) => option.value));
    const selectedValues = new Set(this.selectedChartOverlayKeys());
    const nextOptions = this.buildChartOverlayOptions(chartData);

    nextOptions.forEach((option) => {
      if (previousValues.has(option.value) || this.hiddenChartOverlayKeys.has(option.value)) {
        return;
      }

      if (this.shouldSelectChartOverlayByDefault(option.value)) {
        selectedValues.add(option.value);
        return;
      }

      this.hiddenChartOverlayKeys.add(option.value);
    });

    this.chartOverlayOptions = nextOptions;
    this.selectedChartOverlayKeys.set(
      nextOptions
        .map((option) => option.value)
        .filter((value) => selectedValues.has(value) && !this.hiddenChartOverlayKeys.has(value)),
    );
  }

  private buildChartOverlayOptions(
    chartData: TradeBotChartResponse | TradeBotOverlayResponse | null,
  ): ChartOverlayOption[] {
    const optionMap = new Map<string, ChartOverlayOption>();
    const addOption = (kind: ChartOverlayKind, name?: string): void => {
      const value = this.chartOverlayKey(kind, name);
      if (optionMap.has(value)) {
        return;
      }
      optionMap.set(value, {
        kind,
        value,
        label: this.chartOverlayLabel(kind, name),
      });
    };

    (chartData?.lineData ?? []).forEach((item) => addOption('line', item.name));
    (chartData?.areaData ?? []).forEach((item) => addOption('area', item.name));
    (chartData?.pointData ?? []).forEach((item) => addOption('point', item.name));
    (chartData?.indicatorData ?? []).forEach((item) => addOption('indicator', item.name));
    return Array.from(optionMap.values()).sort((left, right) =>
      left.label.localeCompare(right.label),
    );
  }

  private isChartOverlayVisible(kind: ChartOverlayKind, name?: string): boolean {
    const options = this.chartOverlayOptions;
    if (options.length === 0) {
      return true;
    }
    return this.selectedChartOverlayKeys().includes(this.chartOverlayKey(kind, name));
  }

  private shouldSelectChartOverlayByDefault(value: string): boolean {
    const normalized = value.toUpperCase();
    return !(
      normalized.startsWith('LINE:') &&
      (normalized.includes('BULLISH_OB') || normalized.includes('BEARISH_OB'))
    );
  }

  private chartOverlayKey(kind: ChartOverlayKind, name?: string): string {
    return `${kind}:${this.normalizeOverlayName(name)}`;
  }

  private chartOverlayLabel(kind: ChartOverlayKind, name?: string): string {
    const label = this.compactPreviewLabel(name ?? this.fallbackOverlayName(kind));
    return `${this.i18nService.t(this.chartOverlayKindLabelKey(kind))}: ${label}`;
  }

  private chartOverlayKindLabelKey(kind: ChartOverlayKind): string {
    switch (kind) {
      case 'line':
        return 'tradeBot.replay.chart.overlayLine';
      case 'area':
        return 'tradeBot.replay.chart.overlayArea';
      case 'point':
        return 'tradeBot.replay.chart.overlayPoint';
      case 'indicator':
        return 'tradeBot.replay.chart.overlayIndicator';
    }
  }

  private normalizeOverlayName(name?: string): string {
    return this.compactPreviewLabel(name ?? 'Overlay')
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  private fallbackOverlayName(kind: ChartOverlayKind): string {
    switch (kind) {
      case 'line':
        return 'Line';
      case 'area':
        return 'Area zone';
      case 'point':
        return 'Point';
      case 'indicator':
        return 'Indicator';
    }
  }

  private rangeOverlaps(
    from?: number,
    to?: number,
    visibleStartTime?: number,
    visibleEndTime?: number,
  ): boolean {
    if (from == null || to == null || visibleStartTime == null || visibleEndTime == null) {
      return false;
    }
    return from <= visibleEndTime && to >= visibleStartTime;
  }

  private resolvePreviewPointSize(name?: string): number {
    const normalized = String(name ?? '').toUpperCase();
    return normalized.includes('BOS') || normalized.includes('CHOCH') ? 0.75 : 0.65;
  }

  private limitNewestByTime<T>(items: T[], resolveTime: (item: T) => number, limit: number): T[] {
    if (items.length <= limit) {
      return items;
    }
    return items
      .slice()
      .sort((left, right) => resolveTime(right) - resolveTime(left))
      .slice(0, limit)
      .sort((left, right) => resolveTime(left) - resolveTime(right));
  }

  private compactPreviewLabel(label: string): string {
    const normalized = label
      .replace(/^SMC\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    const upper = normalized.toUpperCase();
    if (upper.includes('CHOCH')) {
      return 'CHoCH';
    }
    if (upper.includes('BOS')) {
      return 'BOS';
    }
    if (upper.includes('EQH')) {
      return 'EQH';
    }
    if (upper.includes('EQL')) {
      return 'EQL';
    }
    if (upper.includes('WEAK HIGH')) {
      return 'Weak High';
    }
    if (upper.includes('WEAK LOW')) {
      return 'Weak Low';
    }
    if (upper.includes('STRONG HIGH')) {
      return 'Strong High';
    }
    if (upper.includes('STRONG LOW')) {
      return 'Strong Low';
    }
    if (upper.includes('BULLISH OB')) {
      return 'Bullish OB';
    }
    if (upper.includes('BEARISH OB')) {
      return 'Bearish OB';
    }
    return normalized;
  }

  private resetChartPayloadCache(): void {
    this.chartPayloadCacheKey = '';
    this.chartPayloadCache = this.emptyChartPayload();
  }

  private loadChartViewData(
    timeframe: StrategyTimeframe,
    fallbackTimeframe: StrategyTimeframe,
  ): void {
    if (!this.job) {
      return;
    }

    if (timeframe === this.replayChartTimeframe && this.previewChartData) {
      this.chartViewRequestKey = '';
      this.chartViewLoading.set(false);
      this.chartViewData = this.previewChartData;
      this.chartViewDataVersion++;
      this.resetChartPayloadCache();
      return;
    }

    const job = this.job;
    const dataResource = this.resolveDataResource(job.exchangeCode);
    const startTime = this.resolveReplayStartTime(job, this.orders);
    const endTime = this.resolveReplayEndTime(job, this.orders);
    const requestKey = `${job.id}|${dataResource}|${timeframe}|${startTime}|${endTime}`;
    this.chartViewRequestKey = requestKey;
    this.chartViewLoading.set(true);

    this.subscriptions.add(
      this.chartQueryService
        .getCandle(
          job.providerSymbol || job.symbolCode,
          this.toIntervalKey(timeframe, dataResource),
          startTime,
          endTime,
          dataResource,
        )
        .pipe(
          finalize(() => {
            if (this.chartViewRequestKey === requestKey) {
              this.chartViewLoading.set(false);
            }
          }),
        )
        .subscribe({
          next: (chartData) => {
            if (this.chartViewRequestKey !== requestKey) {
              return;
            }
            this.chartViewData = chartData;
            this.chartViewDataVersion++;
            this.resetChartPayloadCache();
          },
          error: () => {
            if (this.chartViewRequestKey !== requestKey) {
              return;
            }
            this.chartViewTimeframe.set(fallbackTimeframe);
            this.updateChartConfig();
            this.toastService.error(this.i18nService.t('tradeBot.loadChartDataError'));
          },
        }),
    );
  }

  private updateChartConfig(
    job: BacktestJobResponse | null = this.job,
    timeframe = this.chartViewTimeframe(),
  ): void {
    this.chartConfig = {
      ...this.chartConfig,
      symbol:
        job?.providerSymbol ||
        job?.symbolCode ||
        this.binding?.providerSymbol ||
        this.binding?.symbolCode,
      exchange: job?.exchangeCode || this.binding?.exchangeCode,
      interval: timeframe,
    };
  }

  private emptyChartPayload(): CandleChartPayload {
    return {
      candles: [],
      lines: [],
      boxAreas: [],
      points: [],
      indicators: [],
    };
  }

  private formatDate(value: Date | null): string {
    const date = value ?? new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toDateOffset(offsetDays: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date;
  }

  private resolveReplayTimeframe(config: Record<string, unknown>): StrategyTimeframe {
    return this.toStrategyTimeframe(
      config['timeframe'] ?? config['trigger_timeframe'] ?? config['base_timeframe'],
      DEFAULT_REPLAY_TIMEFRAME,
    );
  }

  private resolveDataResource(exchangeCode?: string): string {
    return String(exchangeCode ?? '')
      .toUpperCase()
      .includes('OANDA')
      ? 'OANDA'
      : 'BINANCE';
  }

  private resolveReplayStartTime(
    job: BacktestJobResponse,
    orders: BacktestOrderResponse[],
  ): number {
    const jobStart = new Date(`${job.fromDate}T00:00:00Z`).getTime();
    const firstOrderTime = orders.reduce(
      (min, order) => Math.min(min, order.entryTime),
      Number.POSITIVE_INFINITY,
    );
    return Number.isFinite(firstOrderTime) ? Math.min(jobStart, firstOrderTime) : jobStart;
  }

  private resolveRulePreviewStartTime(
    job: BacktestJobResponse,
    orders: BacktestOrderResponse[],
  ): number {
    const replayStartTime = this.resolveReplayStartTime(job, orders);
    const lookbackDays = this.resolveRulePreviewLookbackDays(job);
    return replayStartTime - lookbackDays * 24 * 60 * 60 * 1000;
  }

  private resolveRulePreviewLookbackDays(job: BacktestJobResponse): number {
    const config = this.resolveRulePreviewConfig(job);
    const rawValue = config['lookbackTradingDays'] ?? config['lookback_trading_days'];
    const parsedValue = Number(rawValue);
    if (Number.isFinite(parsedValue) && parsedValue >= 0) {
      return parsedValue;
    }
    return String(job.strategyServiceName ?? '')
      .toUpperCase()
      .includes('SMART_MONEY')
      ? 120
      : 0;
  }

  private resolveRulePreviewConfig(job: BacktestJobResponse): Record<string, unknown> {
    const config: Record<string, unknown> = {
      ...(this.binding?.configJson ?? {}),
      ...(job.configJson ?? {}),
    };

    if (config['selected_rules'] == null && this.binding?.selectedRules?.length) {
      config['selected_rules'] = this.binding.selectedRules.map((rule) => ({
        slotCode: rule.slotCode,
        ruleCode: rule.ruleCode,
        configJson: rule.configJson ?? {},
      }));
    }

    return config;
  }

  private resolveReplayEndTime(job: BacktestJobResponse, orders: BacktestOrderResponse[]): number {
    const jobEnd = new Date(`${job.toDate}T23:59:59Z`).getTime();
    const lastOrderTime = orders.reduce(
      (max, order) => Math.max(max, order.exitTime ?? order.entryTime),
      0,
    );
    return Math.max(jobEnd, lastOrderTime);
  }

  private toIntervalKey(timeframe: string, dataResource: string): string {
    const normalized = String(timeframe ?? '')
      .trim()
      .toUpperCase();
    if (dataResource === 'BINANCE') {
      switch (normalized) {
        case 'M1':
          return '1m';
        case 'M5':
          return '5m';
        case 'M15':
          return '15m';
        case 'M30':
          return '30m';
        case 'H1':
          return '1h';
        case 'H4':
          return '4h';
        case 'D1':
          return '1d';
        default:
          return normalized.toLowerCase() || '5m';
      }
    }
    switch (normalized) {
      case 'M1':
        return 'm1';
      case 'M5':
        return 'm5';
      case 'M15':
        return 'm15';
      case 'M30':
        return 'm30';
      case 'H1':
        return 'h1';
      case 'H4':
        return 'h4';
      case 'D1':
        return 'd1';
      default:
        return normalized.toLowerCase() || 'm5';
    }
  }

  private toStrategyTimeframe(value: unknown, fallback: StrategyTimeframe): StrategyTimeframe {
    const normalized = String(value ?? '')
      .trim()
      .toUpperCase();
    const aliases: Record<string, StrategyTimeframe> = {
      M1: StrategyTimeframe.M1,
      '1M': StrategyTimeframe.M1,
      M5: StrategyTimeframe.M5,
      '5M': StrategyTimeframe.M5,
      M15: StrategyTimeframe.M15,
      '15M': StrategyTimeframe.M15,
      M30: StrategyTimeframe.M30,
      '30M': StrategyTimeframe.M30,
      H1: StrategyTimeframe.H1,
      '1H': StrategyTimeframe.H1,
      H4: StrategyTimeframe.H4,
      '4H': StrategyTimeframe.H4,
      D1: StrategyTimeframe.D1,
      '1D': StrategyTimeframe.D1,
    };
    return aliases[normalized] ?? fallback;
  }

  private toIsoTime(value: number): string {
    return new Date(value).toISOString();
  }
}
