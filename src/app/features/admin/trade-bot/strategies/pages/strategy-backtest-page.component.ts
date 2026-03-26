import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of, switchMap } from 'rxjs';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { CandleChartPayload, ChartBoxArea, ChartLine, ChartPoint } from '../../../../../shared/component/candle-chart/candle-chart';
import { BacktestJobResponse, BacktestMetricResponse, BacktestOrderResponse, BacktestRunDto } from '../../../../../core/models/trade-bot/backtest.model';
import { ReplayStepEvent, ReplayTradeTimelineItem, StrategyReplayEventType, StrategyReplayPayload } from '../../../../../core/models/trade-bot/strategy-replay.model';
import { TradeStrategyBindingResponse } from '../../../../../core/models/trade-bot/trade-strategy-binding.model';
import { BacktestService } from '../../../../../core/services/trade-bot-service/backtest.service';
import { ChartQueryService } from '../../../../../core/services/trade-bot-service/chart-query.service';
import { TradeStrategyBindingService } from '../../../../../core/services/trade-bot-service/trade-strategy-binding.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { STRATEGY_MANAGEMENT_ROUTES } from '../strategy-management.constants';
import { StrategyReplayFacade } from '../replay/strategy-replay.facade';
import { buildChartReplayPayload } from '../replay/strategy-replay-chart.builder';
import { TradeBotTextKey } from '../shared/strategy-ui.enums';

type BacktestRunFormGroup = FormGroup<{
  fromDate: FormControl<Date | null>;
  toDate: FormControl<Date | null>;
  initialBalance: FormControl<number>;
  feeRate: FormControl<number>;
  slippageRate: FormControl<number>;
  riskPerTradePct: FormControl<number>;
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
  readonly chartConfig = {
    showCandles: true,
    showVolume: true,
    showLines: true,
    showBoxAreas: true,
    showPoints: true
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
    rows: 20,
    rowsPerPageOptions: [10, 20, 50, 100]
  };

  binding: TradeStrategyBindingResponse | null = null;
  job: BacktestJobResponse | null = null;
  metric: BacktestMetricResponse | null = null;
  orders: BacktestOrderResponse[] = [];
  replayPayload: StrategyReplayPayload | null = null;
  running = false;
  loadingOrders = false;

  readonly runForm: BacktestRunFormGroup = new FormGroup({
    fromDate: new FormControl(this.toDateOffset(-30), { validators: [Validators.required] }),
    toDate: new FormControl(this.toDateOffset(0), { validators: [Validators.required] }),
    initialBalance: new FormControl(10_000, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    feeRate: new FormControl(0.0005, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    slippageRate: new FormControl(0.0002, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    riskPerTradePct: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] })
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
      lines: activeOverlays
        .filter((overlay) => ['entry', 'stop-loss', 'take-profit', 'indicator-line', 'bos', 'choch'].includes(overlay.type))
        .map((overlay) => this.toChartLine(overlay.payload, overlay.label)),
      boxAreas: activeOverlays
        .filter((overlay) => ['session-zone', 'area-zone', 'order-block', 'fvg', 'liquidity'].includes(overlay.type))
        .map((overlay) => this.toChartBoxArea(overlay.payload, overlay.label)),
      points: visibleEvents.map((event) => this.toChartPoint(event))
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
          switchMap(({ job, metric, orders }) =>
            this.chartQueryService
              .getCandle(
                job.providerSymbol || job.symbolCode,
                this.resolveReplayInterval(binding),
                this.resolveReplayStartTime(job, orders.data ?? []),
                this.resolveReplayEndTime(job, orders.data ?? []),
                this.resolveDataResource(job.exchangeCode)
              )
              .pipe(
                catchError(() => of({ candlestickData: [], lineData: [], areaData: [], pointData: [] })),
                switchMap((chartData) =>
                  of({
                    job,
                    metric,
                    orders,
                    replay: buildChartReplayPayload(job, chartData, orders.data ?? [], metric)
                  })
                )
              )
          )
        )
      )
      .pipe(finalize(() => (this.loadingOrders = false)))
      .subscribe({
        next: ({ job, metric, orders, replay }) => {
          this.job = job;
          this.metric = metric;
          this.orders = orders.data ?? [];
          this.replayPayload = replay;
          this.replay.setPayload(this.replayPayload);
        },
        error: () => this.toastService.error(this.i18nService.t(TradeBotTextKey.LoadReplayFailed))
      });
  }

  private buildRunPayload(binding: TradeStrategyBindingResponse): BacktestRunDto {
    const formValue = this.runForm.getRawValue();
    return {
      exchangeCode: binding.exchangeCode,
      symbolCode: binding.symbolCode,
      strategyCode: binding.strategyCode,
      marketType: binding.marketType,
      tradeSideMode: binding.tradeSideMode,
      fromDate: this.formatDate(formValue.fromDate),
      toDate: this.formatDate(formValue.toDate),
      initialBalance: formValue.initialBalance,
      feeRate: formValue.feeRate,
      slippageRate: formValue.slippageRate,
      riskConfig: {
        riskPerTradePct: formValue.riskPerTradePct
      }
    };
  }

  private applyBacktestDefaults(binding: TradeStrategyBindingResponse): void {
    const defaults = (binding.configJson?.['backtest_defaults'] as Record<string, unknown> | undefined) ?? {};
    this.runForm.patchValue({
      initialBalance: Number(defaults['initialBalance'] ?? 10_000),
      feeRate: Number(defaults['feeRate'] ?? 0.0005),
      slippageRate: Number(defaults['slippageRate'] ?? 0.0002),
      riskPerTradePct: Number(defaults['riskPerTradePct'] ?? 1)
    });
  }

  private toChartLine(payload: Record<string, unknown>, fallbackName: string): ChartLine {
    return {
      name: String(payload['label'] ?? fallbackName),
      color: String(payload['color'] ?? '#2563eb'),
      start: Number(payload['start'] ?? 0),
      end: Number(payload['end'] ?? payload['start'] ?? 0),
      startTime: String(payload['startTime'] ?? ''),
      endTime: String(payload['endTime'] ?? payload['startTime'] ?? '')
    };
  }

  private toChartBoxArea(payload: Record<string, unknown>, fallbackName: string): ChartBoxArea {
    return {
      name: String(payload['label'] ?? fallbackName),
      color: String(payload['color'] ?? 'rgba(37,99,235,0.08)'),
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

  private colorForEvent(type: StrategyReplayEventType): string {
    switch (type) {
      case 'order-placed':
        return '#2563eb';
      case 'tp-hit':
        return '#16a34a';
      case 'sl-hit':
        return '#dc2626';
      case 'setup-formed':
        return '#f59e0b';
      default:
        return '#64748b';
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

  private resolveReplayInterval(binding: TradeStrategyBindingResponse): string {
    const config = binding.configJson ?? {};
    return this.toIntervalKey(String(config['trigger_timeframe'] ?? config['base_timeframe'] ?? 'M5'));
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

  private toIntervalKey(timeframe: string): string {
    const normalized = String(timeframe ?? '').trim().toUpperCase();
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
}
