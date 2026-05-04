import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of, Subscription, switchMap } from 'rxjs';
import { TableConfig } from '../../../../../../shared/ui/table/models/table-config.model';
import { CandleChartPayload, ChartBoxArea, ChartIndicatorSeries, ChartLine, ChartPoint } from '../../../../../../shared/component/candle-chart/candle-chart';
import { BacktestJobResponse, BacktestMetricResponse, BacktestOrderResponse, BacktestRunDto } from '../../../../../../core/models/trade-bot/backtest.model';
import { TradeBotAreaData, TradeBotCandleResponse, TradeBotIndicatorData, TradeBotLineData } from '../../../../../../core/models/trade-bot/chart-query.model';
import { ReplayStepEvent, ReplayTradeTimelineItem, StrategyReplayEventType, StrategyReplayPayload } from '../../../../../../core/models/trade-bot/strategy-replay.model';
import { TradeStrategyBindingResponse } from '../../../../../../core/models/trade-bot/trade-strategy-binding.model';
import { BacktestService } from '../../../../../../core/services/trade-bot-service/backtest.service';
import { ChartQueryService } from '../../../../../../core/services/trade-bot-service/chart-query.service';
import { TradeStrategyBindingService } from '../../../../../../core/services/trade-bot-service/trade-strategy-binding.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { STRATEGY_MANAGEMENT_ROUTES } from '../../strategy-management.constants';
import { StrategyReplayFacade } from '../../replay/strategy-replay.facade';
import { buildChartReplayPayload } from '../../replay/strategy-replay-chart.builder';
import { BACKTEST_RISK_MODE_OPTIONS, BacktestRiskMode, TradeBotTextKey } from '../../shared/strategy-ui.enums';

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

@Component({
  selector: 'app-strategy-backtest-page',
  standalone: false,
  providers: [StrategyReplayFacade],
  templateUrl: './strategy-backtest-page.component.html',
  styleUrl: './strategy-backtest-page.component.css'
})
export class StrategyBacktestPageComponent implements OnInit, OnDestroy {
  readonly TEXT = TradeBotTextKey;
  readonly riskModes = BacktestRiskMode;
  readonly riskModeOptions = BACKTEST_RISK_MODE_OPTIONS;
  readonly chartConfig = {
    showCandles: true,
    showVolume: true,
    showLines: true,
    showBoxAreas: true,
    showPoints: true,
    showIndicators: true
  };

  readonly orderTableConfig: TableConfig = {
    title: TradeBotTextKey.BacktestOrders,
    columns: [
      { field: 'nyTradeDate', header: TradeBotTextKey.TradeDate, sortable: true },
      { field: 'orderSide', header: TradeBotTextKey.Side, sortable: true },
      { field: 'entryPrice', header: TradeBotTextKey.EntryPrice, sortable: true, type: 'number' },
      { field: 'stopLoss', header: 'SL', sortable: true, type: 'number' },
      { field: 'takeProfit', header: 'TP', sortable: true, type: 'number' },
      { field: 'exitPrice', header: TradeBotTextKey.ExitPrice, sortable: true, type: 'number' },
      { field: 'netPnl', header: 'Net PnL', sortable: true, type: 'number' },
      { field: 'result', header: TradeBotTextKey.Result, sortable: true },
      { field: 'exitReason', header: TradeBotTextKey.ExitReason, sortable: true }
    ],
    pagination: true,
    scrollHeight: '28rem',
    minWidth: '100%',
    rows: 20,
    rowsPerPageOptions: [10, 20, 50, 100]
  };

  binding: TradeStrategyBindingResponse | null = null;
  job: BacktestJobResponse | null = null;
  metric: BacktestMetricResponse | null = null;
  orders: BacktestOrderResponse[] = [];
  replayPayload: StrategyReplayPayload | null = null;
  previewChartData: TradeBotCandleResponse | null = null;
  running = false;
  loadingOrders = false;
  private readonly subscriptions = new Subscription();

  readonly runForm: BacktestRunFormGroup = new FormGroup({
    fromDate: new FormControl(this.toDateOffset(-30), { validators: [Validators.required] }),
    toDate: new FormControl(this.toDateOffset(0), { validators: [Validators.required] }),
    initialBalance: new FormControl(10_000, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    feeRate: new FormControl(0.0005, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    slippageRate: new FormControl(0.0002, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    riskMode: new FormControl<BacktestRiskMode>(BacktestRiskMode.EQUITY_PERCENT, { nonNullable: true, validators: [Validators.required] }),
    fixedRiskAmount: new FormControl(100, { nonNullable: true }),
    riskPercentPerTrade: new FormControl(1, { nonNullable: true })
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
    readonly replay: StrategyReplayFacade
  ) {}

  ngOnInit(): void {
    this.syncRiskValidators();
    this.subscriptions.add(this.runForm.controls.riskMode.valueChanges.subscribe(() => this.syncRiskValidators()));

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
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.replay.destroy();
  }

  get currentStepLabel(): string {
    const step = this.replay.currentStep();
    return step ? `${this.i18nService.t(TradeBotTextKey.Step)} ${step.index + 1} / ${this.replay.steps().length}` : '--';
  }

  get currentRules() {
    return this.replay.currentStep()?.ruleExplanations ?? [];
  }

  get chartPayload(): CandleChartPayload {
    const steps = this.replay.steps().slice(0, this.replay.currentStepIndex() + 1);
    const activeOverlays = this.replay.activeOverlaySlice();
    const visibleEvents = this.replay.events().filter((event) => event.stepIndex <= this.replay.currentStepIndex());

    return {
      candles: steps.map((step) => step.candle),
      lines: [
        ...activeOverlays
          .filter((overlay) => ['entry', 'stop-loss', 'take-profit', 'indicator-line', 'bos', 'choch'].includes(overlay.type))
          .map((overlay) => this.toChartLine(overlay.payload, overlay.label)),
        ...this.toPreviewLines(this.replay.currentStep()?.candleTime)
      ],
      boxAreas: [
        ...activeOverlays
          .filter((overlay) => ['session-zone', 'area-zone', 'order-block', 'fvg', 'liquidity'].includes(overlay.type))
          .map((overlay) => this.toChartBoxArea(overlay.payload, overlay.label)),
        ...this.toPreviewAreas(this.replay.currentStep()?.candleTime)
      ],
      points: visibleEvents.map((event) => this.toChartPoint(event)),
      indicators: this.toPreviewIndicators(steps.length)
    };
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
          void this.router.navigate([], { relativeTo: this.route, queryParams: { jobId: job.id }, queryParamsHandling: 'merge' });
          this.loadReplayJob(job.id);
        },
        error: () => this.toastService.error(this.i18nService.t(TradeBotTextKey.RunBacktestFailed))
      });
  }

  onTradeSelected(trade: ReplayTradeTimelineItem): void {
    this.replay.jumpToTrade(trade.id);
  }

  onEventSelected(event: ReplayStepEvent): void {
    this.replay.jumpToEvent(event.id);
  }

  private loadReplayJob(jobId: string): void {
    if (!this.binding) {
      return;
    }
    const binding = this.binding;

    this.loadingOrders = true;
    this.loadingService
      .track(
        forkJoin({
          job: this.backtestService.getById(jobId),
          metric: this.backtestService.getMetrics(jobId).pipe(catchError(() => of(null))),
          orders: this.backtestService.getOrders(jobId, 0, 500, ['entryTime,asc']).pipe(catchError(() => of({ data: [], metadata: null } as any)))
        }).pipe(
          switchMap(({ job, metric, orders }) => {
            const previewConfig = job.configJson ?? binding.configJson ?? {};
            const dataResource = this.resolveDataResource(job.exchangeCode);
            return this.chartQueryService
              .getStrategyPreview(
                job.providerSymbol || job.symbolCode,
                this.resolveReplayInterval(previewConfig, dataResource),
                this.resolveReplayStartTime(job, orders.data ?? []),
                this.resolveReplayEndTime(job, orders.data ?? []),
                binding.strategyServiceName ?? job.strategyServiceName,
                previewConfig,
                dataResource
              )
              .pipe(
                catchError(() => of({ candlestickData: [], lineData: [], areaData: [], pointData: [], indicatorData: [] })),
                switchMap((chartData) =>
                  of({
                    job,
                    metric,
                    orders,
                    chartData,
                    replay: buildChartReplayPayload(job, chartData, orders.data ?? [], metric)
                  })
                )
              );
          })
        )
      )
      .pipe(finalize(() => (this.loadingOrders = false)))
      .subscribe({
        next: ({ job, metric, orders, chartData, replay }) => {
          this.job = job;
          this.metric = metric;
          this.orders = orders.data ?? [];
          this.previewChartData = chartData;
          this.replayPayload = replay;
          this.replay.setPayload(this.replayPayload);
        },
        error: () => this.toastService.error(this.i18nService.t(TradeBotTextKey.LoadReplayFailed))
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
      riskConfig: this.buildRiskConfig(formValue)
    };
  }

  private buildRiskConfig(formValue: BacktestRunFormGroup['value']): Record<string, unknown> {
    if (formValue.riskMode === BacktestRiskMode.FIXED_AMOUNT) {
      return {
        riskMode: BacktestRiskMode.FIXED_AMOUNT,
        fixedRiskAmount: Number(formValue.fixedRiskAmount ?? 0)
      };
    }

    return {
      riskMode: BacktestRiskMode.EQUITY_PERCENT,
      riskPercentPerTrade: Number(formValue.riskPercentPerTrade ?? 0)
    };
  }

  private applyBacktestDefaults(binding: TradeStrategyBindingResponse): void {
    const tradeManagementRule = this.findSelectedRuleConfig(binding, 'TRADE_MANAGEMENT_RULE', 'TRADE_MANAGEMENT');
    const defaults =
      ((tradeManagementRule?.['backtest_defaults'] as Record<string, unknown> | undefined) ?? {
        initialBalance: tradeManagementRule?.['backtest_initial_balance'],
        feeRate: tradeManagementRule?.['backtest_fee_rate'],
        slippageRate: tradeManagementRule?.['backtest_slippage_rate'],
        fixedRiskAmount: tradeManagementRule?.['backtest_fixed_risk_amount'],
        riskPercentPerTrade: tradeManagementRule?.['backtest_risk_per_trade_pct']
      }) ??
      {};
    const hasFixedRiskDefault = defaults['fixedRiskAmount'] != null;
    const hasPercentRiskDefault = defaults['riskPercentPerTrade'] != null || defaults['riskPerTradePct'] != null;
    const fixedRiskAmount = Number(defaults['fixedRiskAmount'] ?? 100);
    const riskPercentPerTrade = Number(defaults['riskPercentPerTrade'] ?? defaults['riskPerTradePct'] ?? 1);
    this.runForm.patchValue({
      initialBalance: Number(defaults['initialBalance'] ?? 10_000),
      feeRate: Number(defaults['feeRate'] ?? 0.0005),
      slippageRate: Number(defaults['slippageRate'] ?? 0.0002),
      riskMode: hasFixedRiskDefault && !hasPercentRiskDefault ? BacktestRiskMode.FIXED_AMOUNT : BacktestRiskMode.EQUITY_PERCENT,
      fixedRiskAmount,
      riskPercentPerTrade
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
    ruleCode: string
  ): Record<string, unknown> | undefined {
    return binding.selectedRules?.find(
      (item) => item.slotCode?.toUpperCase() === slotCode || item.ruleCode?.toUpperCase() === ruleCode
    )?.configJson;
  }

  private toChartLine(payload: Record<string, unknown>, fallbackName: string): ChartLine {
    return {
      name: String(payload['label'] ?? fallbackName),
      color: String(payload['color'] ?? 'var(--app-chart-primary)'),
      start: Number(payload['start'] ?? 0),
      end: Number(payload['end'] ?? payload['start'] ?? 0),
      startTime: String(payload['startTime'] ?? ''),
      endTime: String(payload['endTime'] ?? payload['startTime'] ?? '')
    };
  }

  private toChartBoxArea(payload: Record<string, unknown>, fallbackName: string): ChartBoxArea {
    return {
      name: String(payload['label'] ?? fallbackName),
      color: String(payload['color'] ?? 'var(--app-chart-primary-fill)'),
      startTime: String(payload['startTime'] ?? ''),
      endTime: String(payload['endTime'] ?? payload['startTime'] ?? ''),
      high: Number(payload['high'] ?? 0),
      low: Number(payload['low'] ?? 0)
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
            : trade?.exitPrice ?? trade?.entryPrice ?? this.replay.currentStep()?.candle.close ?? 0;

    return {
      name: event.title,
      color: this.colorForEvent(event.type),
      startTime: new Date(event.candleTime).toISOString(),
      price: Number(price ?? 0)
    };
  }

  private toPreviewIndicators(stepCount: number): ChartIndicatorSeries[] {
    return (this.previewChartData?.indicatorData ?? []).map((indicator: TradeBotIndicatorData) => ({
      name: indicator.name ?? 'Indicator',
      color: indicator.color ?? 'var(--app-chart-violet)',
      pane: indicator.type === 'SUBCHART' ? 'subchart' : 'overlay',
      values: (indicator.value ?? []).slice(0, stepCount).map((value: number | null) => (value == null ? null : Number(value)))
    }));
  }

  private toPreviewLines(currentStepTime?: number): ChartLine[] {
    if (!currentStepTime) {
      return [];
    }
    return (this.previewChartData?.lineData ?? [])
      .filter((item: TradeBotLineData) => item.from && item.to)
      .filter((item: TradeBotLineData) => (item.from?.time ?? 0) <= currentStepTime)
      .map((item: TradeBotLineData) => ({
        name: item.name ?? 'Line',
        color: item.color ?? 'var(--app-chart-info)',
        start: Number(item.from?.value ?? 0),
        end: Number(item.to?.value ?? item.from?.value ?? 0),
        startTime: this.toIsoTime(item.from?.time ?? currentStepTime),
        endTime: this.toIsoTime(Math.min(item.to?.time ?? currentStepTime, currentStepTime))
      }));
  }

  private toPreviewAreas(currentStepTime?: number): ChartBoxArea[] {
    if (!currentStepTime) {
      return [];
    }
    return (this.previewChartData?.areaData ?? [])
      .filter((item: TradeBotAreaData) => item.from != null && item.to != null && item.maxPrice != null && item.minPrice != null)
      .filter((item: TradeBotAreaData) => (item.from ?? 0) <= currentStepTime)
      .map((item: TradeBotAreaData) => ({
        name: item.name ?? 'Zone',
        color: item.color ?? 'var(--app-chart-primary-fill)',
        startTime: this.toIsoTime(item.from ?? currentStepTime),
        endTime: this.toIsoTime(Math.min(item.to ?? currentStepTime, currentStepTime)),
        high: Number(item.maxPrice ?? 0),
        low: Number(item.minPrice ?? 0)
      }));
  }

  private colorForEvent(type: StrategyReplayEventType): string {
    switch (type) {
      case 'order-placed':
        return 'var(--app-chart-primary)';
      case 'tp-hit':
        return 'var(--app-chart-success)';
      case 'sl-hit':
        return 'var(--app-chart-danger)';
      case 'setup-formed':
        return 'var(--app-chart-warning)';
      default:
        return 'var(--app-chart-muted)';
    }
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

  private resolveReplayInterval(config: Record<string, unknown>, dataResource: string): string {
    return this.toIntervalKey(String(config['trigger_timeframe'] ?? config['base_timeframe'] ?? 'M5'), dataResource);
  }

  private resolveDataResource(exchangeCode?: string): string {
    return String(exchangeCode ?? '').toUpperCase().includes('OANDA') ? 'OANDA' : 'BINANCE';
  }

  private resolveReplayStartTime(job: BacktestJobResponse, orders: BacktestOrderResponse[]): number {
    const jobStart = new Date(`${job.fromDate}T00:00:00Z`).getTime();
    const firstOrderTime = orders.reduce((min, order) => Math.min(min, order.entryTime), Number.POSITIVE_INFINITY);
    return Number.isFinite(firstOrderTime) ? Math.min(jobStart, firstOrderTime) : jobStart;
  }

  private resolveReplayEndTime(job: BacktestJobResponse, orders: BacktestOrderResponse[]): number {
    const jobEnd = new Date(`${job.toDate}T23:59:59Z`).getTime();
    const lastOrderTime = orders.reduce((max, order) => Math.max(max, order.exitTime ?? order.entryTime), 0);
    return Math.max(jobEnd, lastOrderTime);
  }

  private toIntervalKey(timeframe: string, dataResource: string): string {
    const normalized = String(timeframe ?? '').trim().toUpperCase();
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

  private toIsoTime(value: number): string {
    return new Date(value).toISOString();
  }
}
