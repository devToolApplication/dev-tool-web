import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import {
  BacktestChartReviewResponse,
  BacktestCurvePointResponse,
  BacktestEventResponse,
  BacktestMetricResponse,
  BacktestOrderResponse,
  BacktestPositionResponse,
  BacktestReviewResponse,
  BacktestRunResponse,
  BacktestTradeResponse,
  CandleBarResponse
} from '../../../../../../core/models/trade-bot/trading-system.model';
import { BacktestReviewService } from '../../../../../../core/services/trade-bot-service/backtest-review.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { AppTabItem } from '../../../../../../shared/component/tabs/tabs.component';
import { CandleChartConfig, CandleChartRangeBoundaryEvent, ChartCandle, ChartOverlay } from '../../../shared-trading/candle-chart/candle-chart';
import {
  buildAdjacentCandleWindow,
  CANDLE_CHART_WINDOW_LIMIT,
  mergeCandlesByOpenTime
} from '../../../shared-trading/candle-chart/candle-window-loader';
import { TableConfig } from '../../../../../../shared/ui/table/models/table-config.model';

@Component({
  selector: 'app-backtest-detail',
  standalone: false,
  templateUrl: './backtest-detail.component.html',
  styleUrl: './backtest-detail.component.css'
})
export class BacktestDetailComponent implements OnInit {
  readonly loading = signal(false);
  readonly chartLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly run = signal<BacktestRunResponse | null>(null);
  readonly trades = signal<BacktestTradeResponse[]>([]);
  readonly metrics = signal<BacktestMetricResponse | null>(null);
  readonly equity = signal<BacktestCurvePointResponse[]>([]);
  readonly drawdown = signal<BacktestCurvePointResponse[]>([]);
  readonly events = signal<BacktestEventResponse[]>([]);
  readonly review = signal<BacktestReviewResponse | null>(null);
  readonly chartReview = signal<BacktestChartReviewResponse | null>(null);
  readonly chartCandlesRaw = signal<CandleBarResponse[]>([]);
  readonly reviewOrders = signal<BacktestOrderResponse[]>([]);
  readonly reviewFills = signal<BacktestOrderResponse[]>([]);
  readonly reviewPositions = signal<BacktestPositionResponse[]>([]);
  readonly configSnapshot = signal<Record<string, unknown> | null>(null);
  readonly marketDataSnapshot = signal<Record<string, unknown> | null>(null);
  readonly reportExport = signal<Record<string, unknown> | null>(null);
  readonly trace = signal<Record<string, unknown> | null>(null);
  readonly selectedTrade = signal<BacktestTradeResponse | null>(null);
  readonly selectedTradeTrace = signal<Record<string, unknown> | null>(null);
  readonly activeTab = signal('overview');

  readonly tabs: AppTabItem[] = [
    { label: 'tradeBot.backtest.tab.overview', value: 'overview' },
    { label: 'tradeBot.backtest.tab.chart', value: 'chart' },
    { label: 'tradeBot.backtest.tab.trades', value: 'trades' },
    { label: 'tradeBot.backtest.tab.orders', value: 'orders' },
    { label: 'tradeBot.backtest.tab.equity', value: 'equity' },
    { label: 'tradeBot.backtest.tab.ruleTrace', value: 'ruleTrace' },
    { label: 'tradeBot.backtest.tab.snapshots', value: 'snapshots' },
    { label: 'tradeBot.backtest.tab.logs', value: 'logs' }
  ];

  readonly summaryCards = computed(() => {
    const run = this.run();
    const metrics = this.metrics()?.metrics ?? {};
    return [
      { label: 'tradeBot.field.status', value: run?.status ?? null },
      { label: 'tradeBot.field.currentBalance', value: run?.currentBalance ?? null },
      { label: 'tradeBot.field.trades', value: this.trades().length },
      { label: 'tradeBot.field.winRate', value: valueOrNull(metrics['winRate'] ?? metrics['WIN_RATE']), suffix: '%' }
    ];
  });

  readonly runFacts = computed(() => {
    const run = this.run();
    return [
      { label: 'tradeBot.field.runId', value: run?.runId ?? this.runId },
      { label: 'tradeBot.field.strategyCode', value: run?.strategyCode },
      { label: 'tradeBot.field.symbol', value: run?.symbol },
      { label: 'tradeBot.field.timeframe', value: run?.timeframe },
      { label: 'tradeBot.field.fromTime', value: run?.fromTime },
      { label: 'tradeBot.field.toTime', value: run?.toTime },
      { label: 'tradeBot.field.candleRangeHash', value: run?.candleRangeHash }
    ];
  });

  readonly metricRows = computed(() =>
    Object.entries(this.metrics()?.metrics ?? {}).map(([metric, value]) => ({
      metric,
      value: valueOrNull(value)
    }))
  );

  readonly chartConfig = computed<CandleChartConfig>(() => ({
    showCandles: true,
    showVolume: true,
    showLines: false,
    showBoxAreas: false,
    showPoints: false,
    showIndicators: false,
    symbol: this.run()?.symbol,
    interval: this.run()?.timeframe,
    height: 460,
    showOverlayLabels: true,
    showToolbar: true,
    showDebugPanel: false,
    loading: this.chartLoading() && this.chartCandlesRaw().length === 0,
    lazyLoadOnPan: true,
    lazyLoadThresholdBars: 32,
    preserveViewportOnDataUpdate: true
  }));

  readonly chartCandles = computed<ChartCandle[]>(() =>
    this.chartCandlesRaw().map((candle, index) => ({
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

  readonly chartOverlays = computed<ChartOverlay[]>(() => (this.chartReview()?.overlays ?? []) as unknown as ChartOverlay[]);

  readonly equityRows = computed(() => this.equity().map((point) => ({ ...point, curve: 'Equity' })));
  readonly drawdownRows = computed(() => this.drawdown().map((point) => ({ ...point, curve: 'Drawdown' })));
  readonly equityTrend = computed(() => trendPoints(this.equity(), 'equity', 'balance'));
  readonly drawdownTrend = computed(() => trendPoints(this.drawdown(), 'drawdownPct', 'drawdown'));

  readonly tradeTableConfig: TableConfig = {
    title: 'tradeBot.backtest.trades',
    columns: [
      { field: 'tradeId', header: 'tradeBot.field.tradeId', minWidth: '18rem' },
      { field: 'side', header: 'tradeBot.field.side', type: 'badge' },
      { field: 'entryIndex', header: 'tradeBot.field.entryIndex', type: 'number' },
      { field: 'exitIndex', header: 'tradeBot.field.exitIndex', type: 'number' },
      { field: 'entryPrice', header: 'tradeBot.field.entryPrice', type: 'number' },
      { field: 'exitPrice', header: 'tradeBot.field.exitPrice', type: 'number' },
      { field: 'pnl', header: 'tradeBot.field.pnl', type: 'semantic-number' },
      {
        field: 'actions',
        header: 'tradeBot.field.actions',
        type: 'actions',
        minWidth: '10rem',
        actions: [
          { label: 'tradeBot.action.detail', icon: 'pi pi-eye', severity: 'info', showLabel: false, onClick: (row) => this.openTrade(row) },
          { label: 'tradeBot.action.trace', icon: 'pi pi-sitemap', severity: 'secondary', showLabel: false, onClick: (row) => this.loadTrace(row.tradeId) }
        ]
      }
    ],
    pagination: true,
    rows: 20,
    minWidth: '82rem'
  };

  readonly eventTableConfig: TableConfig = {
    title: 'tradeBot.backtest.events',
    columns: [
      { field: 'barIndex', header: 'tradeBot.field.index', type: 'number' },
      { field: 'type', header: 'tradeBot.field.type' },
      { field: 'message', header: 'tradeBot.field.message' },
      { field: 'eventTime', header: 'tradeBot.field.time', type: 'date' }
    ],
    pagination: true,
    rows: 20
  };

  readonly orderTableConfig: TableConfig = {
    title: 'tradeBot.backtest.orders',
    columns: [
      { field: 'orderId', header: 'tradeBot.field.orderId', type: 'copyable', minWidth: '18rem' },
      { field: 'tradeId', header: 'tradeBot.field.tradeId', type: 'copyable', minWidth: '18rem' },
      { field: 'side', header: 'tradeBot.field.side', type: 'badge' },
      { field: 'type', header: 'tradeBot.field.type' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'price', header: 'tradeBot.field.price', type: 'number' },
      { field: 'quantity', header: 'tradeBot.field.quantity', type: 'number' },
      { field: 'fee', header: 'tradeBot.field.fee', type: 'number' },
      { field: 'barIndex', header: 'tradeBot.field.index', type: 'number' },
      { field: 'orderTime', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' }
    ],
    pagination: true,
    rows: 20,
    minWidth: '100rem'
  };

  readonly positionTableConfig: TableConfig = {
    title: 'tradeBot.backtest.positions',
    columns: [
      { field: 'positionId', header: 'tradeBot.field.positionId', type: 'copyable', minWidth: '18rem' },
      { field: 'tradeId', header: 'tradeBot.field.tradeId', type: 'copyable', minWidth: '18rem' },
      { field: 'side', header: 'tradeBot.field.side', type: 'badge' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'entryPrice', header: 'tradeBot.field.entryPrice', type: 'number' },
      { field: 'exitPrice', header: 'tradeBot.field.exitPrice', type: 'number' },
      { field: 'quantity', header: 'tradeBot.field.quantity', type: 'number' },
      { field: 'pnl', header: 'tradeBot.field.pnl', type: 'semantic-number' }
    ],
    pagination: true,
    rows: 20,
    minWidth: '82rem'
  };

  readonly metricTableConfig: TableConfig = {
    title: 'tradeBot.backtest.metrics',
    columns: [
      { field: 'metric', header: 'tradeBot.field.metric', minWidth: '14rem' },
      { field: 'value', header: 'tradeBot.field.value', minWidth: '14rem' }
    ],
    pagination: true,
    rows: 12,
    minWidth: '32rem'
  };

  readonly curveTableConfig: TableConfig = {
    title: 'tradeBot.backtest.curves',
    columns: [
      { field: 'curve', header: 'tradeBot.field.type' },
      { field: 'barIndex', header: 'tradeBot.field.index', type: 'number' },
      { field: 'time', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' },
      { field: 'balance', header: 'tradeBot.field.currentBalance', type: 'number' },
      { field: 'equity', header: 'tradeBot.field.equity', type: 'number' },
      { field: 'drawdown', header: 'tradeBot.field.drawdown', type: 'number' },
      { field: 'drawdownPct', header: 'tradeBot.field.drawdownPct', type: 'number', suffix: '%' }
    ],
    pagination: true,
    rows: 20,
    minWidth: '74rem'
  };

  private runId = '';
  private readonly loadedTabs = new Set<string>();

  constructor(
    private readonly service: BacktestReviewService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.runId = this.route.snapshot.paramMap.get('runId') ?? '';
    this.activeTab.set(resolveTab(this.route.snapshot.paramMap.get('reviewTab')));
    this.loadInitial();
  }

  traceJson(): string {
    return JSON.stringify(this.trace(), null, 2);
  }

  metricsJson(): string {
    return JSON.stringify(this.metrics()?.metrics ?? {}, null, 2);
  }

  curveJson(): string {
    return JSON.stringify({ equity: this.equity(), drawdown: this.drawdown() }, null, 2);
  }

  overviewJson(): string {
    return JSON.stringify({ run: this.run(), metrics: this.metrics()?.metrics ?? {} }, null, 2);
  }

  chartReviewJson(): string {
    return JSON.stringify({ chart: this.chartReview(), overlays: this.review()?.overlays ?? [] }, null, 2);
  }

  snapshotJson(): string {
    return JSON.stringify({ config: this.configSnapshot(), marketData: this.marketDataSnapshot() }, null, 2);
  }

  reportJson(): string {
    return JSON.stringify(this.reportExport(), null, 2);
  }

  orders(): BacktestOrderResponse[] {
    return this.reviewOrders();
  }

  fills(): BacktestOrderResponse[] {
    return this.reviewFills();
  }

  positions(): BacktestPositionResponse[] {
    return this.reviewPositions();
  }

  allOrdersAndFills(): BacktestOrderResponse[] {
    return [...this.reviewOrders(), ...this.reviewFills()];
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
    const routeSuffix = tab === 'overview' ? [] : [tabRoute(tab)];
    void this.router.navigate(['/admin/trade-bot/backtests', this.runId, ...routeSuffix]);
    this.loadTab(tab);
  }

  closeTradeDrawer(): void {
    this.selectedTrade.set(null);
    this.selectedTradeTrace.set(null);
  }

  retryActiveTab(): void {
    const tab = this.activeTab();
    if (tab === 'overview') {
      this.loadedTabs.clear();
      this.loadInitial();
      return;
    }
    this.loadedTabs.delete(tab);
    this.loadTab(tab);
  }

  exportReport(): void {
    this.loading.set(true);
    this.loadingService
      .track(this.service.exportBacktestReport(this.runId, 'json'))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (report) => this.reportExport.set(report as unknown as Record<string, unknown>),
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.exportFailed'))
      });
  }

  private loadInitial(): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadingService
      .track(
        forkJoin({
          run: this.service.getBacktest(this.runId),
          metrics: this.service.getBacktestMetrics(this.runId)
        })
      )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.run.set(res.run);
          this.metrics.set(res.metrics);
          this.error.set(null);
          this.loadTab(this.activeTab());
        },
        error: () => this.showError('tradeBot.message.loadFailed')
      });
  }

  private loadTab(tab: string): void {
    if (this.loadedTabs.has(tab)) {
      return;
    }
    switch (tab) {
      case 'chart':
        this.loadChartReview();
        break;
      case 'trades':
        this.loadTrades();
        break;
      case 'orders':
        this.loadOrdersAndFills();
        break;
      case 'equity':
        this.loadEquityCurves();
        break;
      case 'snapshots':
        this.loadSnapshots();
        break;
      case 'logs':
        this.loadLogs();
        break;
      default:
        this.loadedTabs.add(tab);
    }
  }

  private loadChartReview(): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadingService
      .track(this.service.getBacktestReviewChart(this.runId, false))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (chartReview) => {
          this.chartReview.set(chartReview);
          if (this.run()) {
            this.loadChartCandles(this.run()!);
          }
          this.loadedTabs.add('chart');
          this.error.set(null);
        },
        error: () => this.showError('tradeBot.message.loadFailed')
      });
  }

  private loadTrades(): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadingService
      .track(forkJoin({
        trades: this.service.getBacktestTrades(this.runId),
        reviewTrades: this.service.getBacktestReviewTrades(this.runId)
      }))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ trades, reviewTrades }) => {
          this.trades.set(reviewTrades.length ? reviewTrades : trades);
          this.loadedTabs.add('trades');
          this.error.set(null);
        },
        error: () => this.showError('tradeBot.message.loadFailed')
      });
  }

  private loadOrdersAndFills(): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadingService
      .track(this.service.getBacktestReviewOrdersFills(this.runId))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (ordersFills) => {
          this.reviewOrders.set(ordersFills.orders);
          this.reviewFills.set(ordersFills.fills);
          this.reviewPositions.set(ordersFills.positions ?? []);
          this.loadedTabs.add('orders');
          this.error.set(null);
        },
        error: () => this.showError('tradeBot.message.loadFailed')
      });
  }

  private loadEquityCurves(): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadingService
      .track(forkJoin({
        equity: this.service.getBacktestEquityCurve(this.runId),
        drawdown: this.service.getBacktestDrawdownCurve(this.runId)
      }))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ equity, drawdown }) => {
          this.equity.set(equity);
          this.drawdown.set(drawdown);
          this.loadedTabs.add('equity');
          this.error.set(null);
        },
        error: () => this.showError('tradeBot.message.loadFailed')
      });
  }

  private loadSnapshots(): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadingService
      .track(forkJoin({
        configSnapshot: this.service.getBacktestReviewConfigSnapshot(this.runId),
        marketDataSnapshot: this.service.getBacktestReviewMarketDataSnapshot(this.runId)
      }))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ configSnapshot, marketDataSnapshot }) => {
          this.configSnapshot.set(configSnapshot);
          this.marketDataSnapshot.set(marketDataSnapshot);
          this.loadedTabs.add('snapshots');
          this.error.set(null);
        },
        error: () => this.showError('tradeBot.message.loadFailed')
      });
  }

  private loadLogs(): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadingService
      .track(this.service.getBacktestReviewEvents(this.runId, { limit: 200 }))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (events) => {
          this.events.set(events);
          this.loadedTabs.add('logs');
          this.error.set(null);
        },
        error: () => this.showError('tradeBot.message.loadFailed')
      });
  }

  private loadChartCandles(run: BacktestRunResponse): void {
    this.chartLoading.set(true);
    this.service
      .getCandles({
        symbol: run.symbol,
        timeframe: run.timeframe,
        source: run.source,
        marketType: run.marketType,
        feedCode: run.feedCode,
        from: run.fromTime,
        to: run.toTime,
        limit: CANDLE_CHART_WINDOW_LIMIT,
        latest: true
      })
      .pipe(finalize(() => this.chartLoading.set(false)))
      .subscribe({
        next: (candles) => this.chartCandlesRaw.set(candles),
        error: () => this.chartCandlesRaw.set([])
      });
  }

  loadMoreChartCandles(event: CandleChartRangeBoundaryEvent): void {
    const run = this.run();
    if (!run || this.chartLoading()) {
      return;
    }
    const window = buildAdjacentCandleWindow({
      direction: event.direction,
      timeframe: run.timeframe,
      firstOpenTime: event.firstCandle?.openTime ?? event.firstCandle?.time,
      lastOpenTime: event.lastCandle?.openTime ?? event.lastCandle?.time,
      minTime: run.fromTime,
      maxTime: run.toTime,
      limit: CANDLE_CHART_WINDOW_LIMIT
    });
    if (!window) {
      return;
    }
    this.chartLoading.set(true);
    this.service
      .getCandles({
        symbol: run.symbol,
        timeframe: run.timeframe,
        source: run.source,
        marketType: run.marketType,
        feedCode: run.feedCode,
        ...window
      })
      .pipe(finalize(() => this.chartLoading.set(false)))
      .subscribe({
        next: (candles) => this.chartCandlesRaw.set(mergeCandlesByOpenTime(this.chartCandlesRaw(), candles)),
        error: () => undefined
      });
  }

  private loadTrace(tradeId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadingService
      .track(this.service.getBacktestReviewRuleTrace(this.runId, tradeId))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (trace) => {
          this.trace.set(trace);
          this.activeTab.set('ruleTrace');
          this.error.set(null);
          void this.router.navigate(['/admin/trade-bot/backtests', this.runId, 'rule-trace']);
        },
        error: () => this.showError('tradeBot.message.traceMissing')
      });
  }

  private openTrade(trade: BacktestTradeResponse): void {
    this.selectedTrade.set(trade);
    this.selectedTradeTrace.set(null);
    if (!this.events().length) {
      this.loadLogs();
    }
    this.service.getBacktestReviewRuleTrace(this.runId, trade.tradeId).subscribe({
      next: (trace) => this.selectedTradeTrace.set(trace),
      error: () => this.selectedTradeTrace.set(null)
    });
  }

  private showError(messageKey: string): void {
    const message = this.i18nService.t(messageKey);
    this.error.set(message);
    this.toastService.error(message);
  }
}

function valueOrNull(value: unknown): string | number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return typeof value === 'number' || typeof value === 'string' ? value : String(value);
}

function resolveTab(routeTab: string | null): string {
  const map: Record<string, string> = {
    chart: 'chart',
    trades: 'trades',
    orders: 'orders',
    equity: 'equity',
    'rule-trace': 'ruleTrace',
    snapshots: 'snapshots',
    logs: 'logs'
  };
  return routeTab ? map[routeTab] ?? 'overview' : 'overview';
}

function tabRoute(tab: string): string {
  const map: Record<string, string> = {
    ruleTrace: 'rule-trace'
  };
  return map[tab] ?? tab;
}

function trendPoints(points: BacktestCurvePointResponse[], primaryField: 'equity' | 'drawdownPct', fallbackField: 'balance' | 'drawdown'): Array<{ height: number; label: string; value: number }> {
  const values = points
    .map((point) => Number(point[primaryField] ?? point[fallbackField] ?? 0))
    .filter((value) => Number.isFinite(value));
  if (!values.length) {
    return [];
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.slice(-80).map((value, index) => ({
    value,
    label: String(points[index]?.barIndex ?? index),
    height: Math.max(8, ((value - min) / range) * 100)
  }));
}
