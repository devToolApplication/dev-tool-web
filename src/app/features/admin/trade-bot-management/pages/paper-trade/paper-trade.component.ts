import { Component, DestroyRef, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { RealtimeTaskType } from '../../../../../core/models/realtime/realtime.model';
import { RealtimeTaskStateService } from '../../../../../core/services/realtime/realtime-task-state.service';
import { RealtimeWebSocketService } from '../../../../../core/services/realtime/realtime-websocket.service';
import { TaskProgressStoreService } from '../../../../../core/services/realtime/task-progress-store.service';
import { MarketDataService } from '../../../../../core/services/trade-bot-service/market-data.service';
import { TradingSystemService } from '../../../../../core/services/trade-bot-service/trading-system.service';
import { ConfirmDialogService } from '../../../../../shared/ui/overlay/confirm-dialog/confirm-dialog.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { AppTabItem } from '../../../../../shared/component/tabs/tabs.component';
import { SelectOption } from '../../../../../shared/component/select/select';
import { CandleChartConfig, CandleChartRangeBoundaryEvent, ChartCandle, ChartOverlay } from '../../share/candle-chart/candle-chart';
import {
  buildAdjacentCandleWindow,
  CANDLE_CHART_WINDOW_LIMIT,
  mergeCandlesByOpenTime
} from '../../share/candle-chart/candle-window-loader';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { PaperTradeApiService } from '../../data-access/api/paper-trade-api.service';
import {
  PaperTradeAccount,
  PaperTradeEquityPoint,
  PaperTradeEvent,
  PaperTradeFill,
  PaperTradeOrder,
  PaperTradePosition,
  PaperTradeSessionDetail,
  StartPaperTradeSessionRequest
} from '../../data-access/models/paper-trade.model';
import { PaperTradeStoreService } from '../../state/paper-trade-store.service';
import { FEED_CODE_OPTIONS, MARKET_SOURCE_OPTIONS, MARKET_TYPE_OPTIONS, SYMBOL_OPTIONS, TIMEFRAME_OPTIONS } from '../../trade-bot-runtime.constants';

@Component({
  selector: 'app-paper-trade',
  standalone: false,
  templateUrl: './paper-trade.component.html'
})
export class PaperTradeComponent {
  readonly formContext: FormContext = { user: null, mode: 'create' };

  get loading() { return this.store.loading; }
  get actionLoading() { return this.store.actionLoading; }
  get accounts() { return this.store.accounts; }
  get sessions() { return this.store.sessions; }
  get detail() { return this.store.detail; }
  get orders() { return this.store.orders; }
  get fills() { return this.store.fills; }
  get positions() { return this.store.positions; }
  get equityCurve() { return this.store.equityCurve; }
  get events() { return this.store.events; }
  get candles() { return this.store.candles; }
  get progress() { return this.store.progress; }
  readonly strategyOptions = signal<Array<{ label: string; value: string }>>([]);
  readonly activeTab = signal('sessions');
  readonly createAccountVisible = signal(false);
  readonly startSessionVisible = signal(false);
  readonly error = signal<string | null>(null);
  readonly candleLoading = signal(false);
  readonly selectedAccountId = signal('');
  readonly selectedSessionId = signal('');
  readonly tabs: AppTabItem[] = [
    { label: 'tradeBot.paper.sessions', value: 'sessions' },
    { label: 'tradeBot.paper.positions', value: 'positions' },
    { label: 'tradeBot.paper.orders', value: 'orders' },
    { label: 'tradeBot.paper.fills', value: 'fills' },
    { label: 'tradeBot.paper.equityCurve', value: 'equity' },
    { label: 'tradeBot.paper.events', value: 'events' },
    { label: 'tradeBot.paper.snapshot', value: 'snapshot' }
  ];
  readonly accountOptions = computed<SelectOption[]>(() =>
    this.accounts().map((account) => ({ label: `${account.name} (${account.baseCurrency})`, value: account.id }))
  );
  readonly sessionOptions = computed<SelectOption[]>(() =>
    this.sessions()
      .filter((session) => !this.selectedAccountId() || session.accountId === this.selectedAccountId())
      .map((session) => ({ label: `${session.strategyCode} / ${session.symbol} / ${session.status}`, value: session.sessionId }))
  );
  readonly activePositions = computed(() => this.positions().filter((position) => position.status === 'OPEN'));
  readonly activeAccount = computed(() => this.detail()?.account ?? this.accounts().find((account) => account.id === this.selectedAccountId()));
  readonly kpiCards = computed(() => {
    const account = this.activeAccount();
    const detail = this.detail();
    return [
      { label: 'tradeBot.field.currentBalance', value: detail?.summary?.balance ?? account?.currentBalance ?? 0, suffix: ' USDT' },
      { label: 'tradeBot.paper.availableBalance', value: account?.availableBalance ?? 0, suffix: ` ${account?.baseCurrency ?? 'USDT'}` },
      { label: 'tradeBot.paper.lockedBalance', value: account?.lockedBalance ?? 0, suffix: ` ${account?.baseCurrency ?? 'USDT'}` },
      { label: 'tradeBot.field.equity', value: detail?.summary?.equity ?? account?.equity ?? 0, suffix: ` ${account?.baseCurrency ?? 'USDT'}` },
      { label: 'tradeBot.paper.realizedPnl', value: detail?.summary?.realizedPnl ?? account?.realizedPnl ?? 0, suffix: ' USDT' },
      { label: 'tradeBot.paper.unrealizedPnl', value: detail?.summary?.unrealizedPnl ?? account?.unrealizedPnl ?? 0, suffix: ' USDT' },
      { label: 'tradeBot.paper.openPositions', value: detail?.summary?.openPositions ?? this.activePositions().length },
      { label: 'tradeBot.paper.lastBar', value: detail?.summary?.lastEvaluatedBar ?? detail?.session?.lastEvaluatedBarTime ?? '-' }
    ];
  });
  readonly snapshotFacts = computed(() => {
    const snapshot = this.detail()?.snapshot;
    return [
      { label: 'tradeBot.field.snapshotId', value: snapshot?.snapshotId ?? '-' },
      { label: 'tradeBot.field.strategyConfigVersion', value: snapshot?.strategyConfigVersion ?? '-' },
      { label: 'tradeBot.field.executorVersion', value: snapshot?.executorVersion ?? '-' },
      { label: 'tradeBot.field.runtimeVersion', value: snapshot?.runtimeVersion ?? '-' },
      { label: 'tradeBot.field.createdAt', value: snapshot?.snapshotCreatedAt ?? '-' },
      { label: 'tradeBot.paper.configChangedAfterStart', value: snapshot?.configChangedAfterStart ? 'YES' : 'NO' }
    ];
  });

  readonly accountForm: FormConfig = {
    fields: [
      { name: 'name', label: 'tradeBot.paper.accountName', type: 'text', width: '1/3' },
      { name: 'baseCurrency', label: 'tradeBot.paper.baseCurrency', type: 'select', options: [{ label: 'USDT', value: 'USDT' }, { label: 'USDC', value: 'USDC' }, { label: 'USD', value: 'USD' }], width: '1/6' },
      { name: 'initialBalance', label: 'tradeBot.field.initialBalance', type: 'number', suffix: ' USDT', width: '1/4' },
      { name: 'description', label: 'tradeBot.field.description', type: 'text', width: '1/4' }
    ]
  };
  readonly accountInitialValue = {
    name: 'BTCUSDT Paper Account',
    baseCurrency: 'USDT',
    initialBalance: 10000,
    description: 'Ready account for Binance USD-M BTCUSDT paper trade'
  };

  readonly startForm = computed<FormConfig>(() => ({
    fields: [
      {
        name: 'accountId',
        label: 'tradeBot.paper.account',
        type: 'select',
        width: '1/3',
        options: this.accounts().map((account) => ({ label: `${account.name} (${account.baseCurrency})`, value: account.id }))
      },
      { name: 'strategyCode', label: 'tradeBot.field.strategyCode', type: 'auto-complete', options: this.strategyOptions(), width: '1/3' },
      { name: 'symbol', label: 'tradeBot.field.symbol', type: 'auto-complete', options: SYMBOL_OPTIONS, width: '1/6' },
      { name: 'interval', label: 'tradeBot.field.timeframe', type: 'select', options: TIMEFRAME_OPTIONS, width: '1/6' },
      { name: 'source', label: 'tradeBot.field.source', type: 'select', options: MARKET_SOURCE_OPTIONS, width: '1/4' },
      { name: 'marketType', label: 'tradeBot.field.marketType', type: 'select', options: MARKET_TYPE_OPTIONS, width: '1/4' },
      { name: 'feedCode', label: 'tradeBot.field.feedCode', type: 'auto-complete', options: FEED_CODE_OPTIONS, width: '1/4' },
      { name: 'riskPerTradePct', label: 'tradeBot.field.riskPerTradePct', type: 'number', suffix: '%', width: '1/4' },
      { name: 'feeRate', label: 'tradeBot.field.feeRate', type: 'number', suffix: '%', width: '1/4' },
      { name: 'slippageRate', label: 'tradeBot.field.slippageRate', type: 'number', suffix: '%', width: '1/4' },
      { name: 'maxPositionValuePct', label: 'tradeBot.paper.maxPositionValuePct', type: 'number', suffix: '%', width: '1/4' }
    ]
  }));
  readonly startInitialValue = computed(() => ({
    accountId: this.accounts()[0]?.id ?? '',
    strategyCode: 'BTCUSDT_PAPER_DEMO',
    symbol: 'BTCUSDT',
    interval: '1m',
    source: 'BINANCE_USDM',
    marketType: 'USD_M_FUTURES',
    feedCode: 'BINANCE_USDM_BTCUSDT_1M',
    riskPerTradePct: 1,
    feeRate: 0.04,
    slippageRate: 0.01,
    maxPositionValuePct: 20
  }));

  readonly sessionTableConfig: TableConfig = {
    title: 'tradeBot.paper.sessions',
    columns: [
      { field: 'startedAt', header: 'tradeBot.field.startedAt', type: 'date', minWidth: '13rem' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'symbol', header: 'tradeBot.field.symbol' },
      { field: 'interval', header: 'tradeBot.field.timeframe' },
      { field: 'strategyCode', header: 'tradeBot.field.strategyCode', minWidth: '14rem' },
      { field: 'lastEvaluatedBarTime', header: 'tradeBot.paper.lastBar', type: 'date', minWidth: '13rem' },
      {
        field: 'actions',
        header: 'tradeBot.field.actions',
        type: 'actions',
        actions: [{ label: 'tradeBot.action.detail', icon: 'pi pi-eye', severity: 'info', showLabel: false, onClick: (row) => this.loadDetail(row.sessionId) }]
      }
    ],
    pagination: true,
    rows: 10,
    scrollable: true,
    minWidth: '68rem'
  };

  readonly orderTableConfig: TableConfig = {
    title: 'tradeBot.paper.orders',
    columns: [
      { field: 'filledAt', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' },
      { field: 'orderId', header: 'tradeBot.field.orderId', type: 'copyable', minWidth: '18rem' },
      { field: 'side', header: 'tradeBot.field.side', type: 'badge' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'filledPrice', header: 'tradeBot.field.price', type: 'number' },
      { field: 'quantity', header: 'tradeBot.field.quantity', type: 'number' }
    ],
    pagination: true,
    rows: 8,
    scrollable: true,
    minWidth: '70rem'
  };

  readonly positionTableConfig: TableConfig = {
    title: 'tradeBot.paper.positions',
    columns: [
      { field: 'openedAt', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' },
      { field: 'positionId', header: 'tradeBot.field.positionId', type: 'copyable', minWidth: '18rem' },
      { field: 'side', header: 'tradeBot.field.side', type: 'badge' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'entryPrice', header: 'tradeBot.field.entryPrice', type: 'number' },
      { field: 'markPrice', header: 'tradeBot.paper.markPrice', type: 'number' },
      { field: 'stopLoss', header: 'tradeBot.paper.stopLoss', type: 'number' },
      { field: 'takeProfit', header: 'tradeBot.paper.takeProfit', type: 'number' },
      { field: 'quantity', header: 'tradeBot.field.quantity', type: 'number' }
    ],
    pagination: true,
    rows: 8,
    scrollable: true,
    minWidth: '76rem'
  };

  readonly fillTableConfig: TableConfig = {
    title: 'tradeBot.paper.fills',
    columns: [
      { field: 'filledAt', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' },
      { field: 'orderId', header: 'tradeBot.field.orderId', type: 'copyable', minWidth: '18rem' },
      { field: 'side', header: 'tradeBot.field.side', type: 'badge' },
      { field: 'price', header: 'tradeBot.field.price', type: 'number' },
      { field: 'quantity', header: 'tradeBot.field.quantity', type: 'number' },
      { field: 'fee', header: 'tradeBot.field.fee', type: 'number' }
    ],
    pagination: true,
    rows: 8,
    scrollable: true,
    minWidth: '70rem'
  };

  readonly eventTableConfig: TableConfig = {
    title: 'tradeBot.paper.events',
    columns: [
      { field: 'eventTime', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' },
      { field: 'eventType', header: 'tradeBot.field.type', minWidth: '13rem' },
      { field: 'message', header: 'tradeBot.field.message', minWidth: '18rem' },
      { field: 'traceId', header: 'traceId', type: 'copyable', minWidth: '18rem' }
    ],
    pagination: true,
    rows: 8,
    scrollable: true,
    minWidth: '72rem'
  };
  readonly equityTableConfig: TableConfig = {
    title: 'tradeBot.paper.equityCurve',
    columns: [
      { field: 'time', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' },
      { field: 'balance', header: 'tradeBot.field.currentBalance', type: 'number' },
      { field: 'availableBalance', header: 'tradeBot.paper.availableBalance', type: 'number' },
      { field: 'lockedBalance', header: 'tradeBot.paper.lockedBalance', type: 'number' },
      { field: 'equity', header: 'tradeBot.field.equity', type: 'number' },
      { field: 'realizedPnl', header: 'tradeBot.paper.realizedPnl', type: 'semantic-number' },
      { field: 'unrealizedPnl', header: 'tradeBot.paper.unrealizedPnl', type: 'semantic-number' },
      { field: 'drawdown', header: 'tradeBot.field.drawdown', type: 'percent' }
    ],
    pagination: true,
    rows: 10,
    scrollable: true,
    minWidth: '78rem'
  };

  readonly chartConfig = computed<CandleChartConfig>(() => ({
    mode: 'HISTORICAL',
    symbol: this.detail()?.session.symbol ?? 'BTCUSDT',
    interval: this.detail()?.session.interval ?? '1m',
    exchange: 'Binance USD-M',
    showCandles: true,
    showVolume: true,
    showPoints: true,
    showLines: true,
    showBoxAreas: true,
    showOverlayLabels: true,
    height: 520,
    loading: this.candleLoading() && this.candles().length === 0,
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
  readonly chartOverlays = computed<ChartOverlay[]>(() => [
    ...this.orders().map((order): ChartOverlay => ({
      id: order.orderId,
      type: 'MARKER',
      source: 'PAPER_TRADE',
      time: order.filledAt,
      price: Number(order.filledPrice),
      text: order.side,
      color: order.side === 'BUY' ? 'var(--app-chart-candle-up)' : 'var(--app-chart-candle-down)',
      shape: order.side === 'BUY' ? 'arrowUp' : 'arrowDown',
      size: 1
    })),
    ...this.positions().flatMap((position): ChartOverlay[] => [
      {
        id: `${position.positionId}-sl`,
        type: 'PRICE_LINE',
        source: 'PAPER_TRADE',
        price: Number(position.stopLoss ?? 0),
        text: 'SL',
        color: 'var(--app-chart-candle-down)'
      },
      {
        id: `${position.positionId}-tp`,
        type: 'PRICE_LINE',
        source: 'PAPER_TRADE',
        price: Number(position.takeProfit ?? 0),
        text: 'TP',
        color: 'var(--app-chart-candle-up)'
      }
    ])
  ]);

  constructor(
    private readonly store: PaperTradeStoreService,
    private readonly api: PaperTradeApiService,
    private readonly tradingSystemService: TradingSystemService,
    private readonly marketDataService: MarketDataService,
    private readonly realtimeWebSocketService: RealtimeWebSocketService,
    private readonly progressStore: TaskProgressStoreService,
    private readonly taskStateService: RealtimeTaskStateService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService,
    private readonly confirmDialogService: ConfirmDialogService,
    private readonly destroyRef: DestroyRef
  ) {
    this.loadStrategyOptions();
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadingService
      .track(forkJoin({ accounts: this.api.getAccounts(), sessions: this.api.getSessions({ limit: 50 }) }))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ accounts, sessions }) => {
          this.store.accounts.set(accounts);
          this.store.sessions.set(sessions);
          const activeSession =
            sessions.find((session) => session.sessionId === this.selectedSessionId()) ??
            sessions.find((session) => session.status === 'RUNNING') ??
            sessions[0];
          this.selectedAccountId.set(activeSession?.accountId ?? accounts[0]?.id ?? '');
          this.selectedSessionId.set(activeSession?.sessionId ?? '');
          if (activeSession) {
            this.loadDetail(activeSession.sessionId);
          }
          this.error.set(null);
        },
        error: () => {
          const message = this.i18nService.t('tradeBot.message.loadFailed');
          this.error.set(message);
          this.toastService.error(message);
        }
      });
  }

  createAccount(model: Record<string, unknown>): void {
    this.actionLoading.set(true);
    this.loadingService
      .track(
        this.api.createAccount({
          name: String(model['name'] ?? ''),
          description: String(model['description'] ?? ''),
          baseCurrency: String(model['baseCurrency'] ?? 'USDT'),
          initialBalance: Number(model['initialBalance'] ?? 10000),
          createdBy: 'dev-tool-web'
        })
      )
      .pipe(finalize(() => this.actionLoading.set(false)))
      .subscribe({
        next: () => {
          this.toastService.info(this.i18nService.t('tradeBot.paper.accountCreated'));
          this.createAccountVisible.set(false);
          this.reload();
        },
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.saveFailed'))
      });
  }

  startSession(model: Record<string, unknown>): void {
    const payload: StartPaperTradeSessionRequest = {
      accountId: String(model['accountId'] ?? this.accounts()[0]?.id ?? ''),
      strategyCode: String(model['strategyCode'] ?? 'BTCUSDT_PAPER_DEMO'),
      symbol: String(model['symbol'] ?? 'BTCUSDT'),
      interval: String(model['interval'] ?? '1m'),
      source: String(model['source'] ?? 'BINANCE_USDM'),
      marketType: String(model['marketType'] ?? 'USD_M_FUTURES'),
      feedCode: String(model['feedCode'] ?? 'BINANCE_USDM_BTCUSDT_1M'),
      triggerType: 'MANUAL',
      riskPerTradePct: Number(model['riskPerTradePct'] ?? 1),
      feeRate: Number(model['feeRate'] ?? 0.04),
      slippageRate: Number(model['slippageRate'] ?? 0.01),
      maxPositionValuePct: Number(model['maxPositionValuePct'] ?? 20),
      executorVersion: 'paper-v1',
      createdBy: 'dev-tool-web'
    };
    this.actionLoading.set(true);
    this.loadingService
      .track(this.api.startSession(payload))
      .pipe(finalize(() => this.actionLoading.set(false)))
      .subscribe({
        next: (detail) => {
          this.toastService.info(this.i18nService.t('tradeBot.paper.sessionStarted'));
          this.startSessionVisible.set(false);
          this.applyDetail(detail);
          this.watchProgress('PAPER_TRADE_SESSION', detail.session.sessionId);
          this.reload();
        },
        error: () => this.toastService.error(this.i18nService.t('tradeBot.paper.sessionFailed'))
      });
  }

  loadDetail(sessionId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadingService
      .track(
        forkJoin({
          detail: this.api.getSessionDetail(sessionId),
          orders: this.api.getOrders(sessionId),
          fills: this.api.getFills(sessionId),
          positions: this.api.getPositions(sessionId),
          equity: this.api.getEquityCurve(sessionId),
          events: this.api.getEvents(sessionId)
        })
      )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ detail, orders, fills, positions, equity, events }) => {
          this.selectedSessionId.set(detail.session.sessionId);
          this.selectedAccountId.set(detail.session.accountId);
          this.applyDetail(detail);
          this.orders.set(orders);
          this.fills.set(fills);
          this.positions.set(positions);
          this.equityCurve.set(equity);
          this.events.set(events);
          this.watchProgress('PAPER_TRADE_SESSION', detail.session.sessionId);
          this.loadCandles(detail);
          this.error.set(null);
        },
        error: () => {
          const message = this.i18nService.t('tradeBot.message.loadFailed');
          this.error.set(message);
          this.toastService.error(message);
        }
      });
  }

  evaluateLatest(): void {
    const sessionId = this.detail()?.session.sessionId;
    if (!sessionId) {
      return;
    }
    this.actionLoading.set(true);
    this.loadingService
      .track(this.api.evaluateLatest(sessionId))
      .pipe(finalize(() => this.actionLoading.set(false)))
      .subscribe({
        next: () => {
          this.toastService.info(this.i18nService.t('tradeBot.paper.evaluated'));
          this.loadDetail(sessionId);
        },
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.evaluateFailed'))
      });
  }

  pause(): void {
    this.control('pause');
  }

  resume(): void {
    this.control('resume');
  }

  async stop(): Promise<void> {
    const confirmed = await this.confirmDialogService.confirm({ message: 'tradeBot.paper.confirmStop' });
    if (!confirmed) {
      return;
    }
    this.control('stop');
  }

  async resetAccount(): Promise<void> {
    const accountId = this.detail()?.account.id ?? this.accounts()[0]?.id;
    if (!accountId) {
      return;
    }
    const confirmed = await this.confirmDialogService.confirm({ message: 'tradeBot.paper.confirmReset' });
    if (!confirmed) {
      return;
    }
    this.actionLoading.set(true);
    this.loadingService
      .track(this.api.resetAccount(accountId))
      .pipe(finalize(() => this.actionLoading.set(false)))
      .subscribe({
        next: () => {
          this.toastService.info(this.i18nService.t('tradeBot.paper.accountReset'));
          this.reload();
        },
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.saveFailed'))
      });
  }

  snapshotJson(): unknown {
    return this.detail()?.snapshot ?? {};
  }

  retryCurrentView(): void {
    const sessionId = this.selectedSessionId();
    if (sessionId) {
      this.loadDetail(sessionId);
      return;
    }
    this.reload();
  }

  selectAccount(value: unknown): void {
    const accountId = String(value ?? '');
    this.selectedAccountId.set(accountId);
    const session = this.sessions().find((item) => item.accountId === accountId);
    if (session) {
      this.loadDetail(session.sessionId);
    }
  }

  selectSession(value: unknown): void {
    const sessionId = String(value ?? '');
    this.selectedSessionId.set(sessionId);
    if (sessionId) {
      this.loadDetail(sessionId);
    }
  }

  private control(action: 'pause' | 'resume' | 'stop'): void {
    const sessionId = this.detail()?.session.sessionId;
    if (!sessionId) {
      return;
    }
    this.actionLoading.set(true);
    this.loadingService
      .track(this.api[action](sessionId))
      .pipe(finalize(() => this.actionLoading.set(false)))
      .subscribe({
        next: () => this.loadDetail(sessionId),
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.saveFailed'))
      });
  }

  private applyDetail(detail: PaperTradeSessionDetail): void {
    this.store.setDetail(detail);
  }

  private loadCandles(detail: PaperTradeSessionDetail): void {
    this.candleLoading.set(true);
    this.marketDataService
      .getCandles({
        source: detail.session.source,
        marketType: detail.session.marketType,
        feedCode: detail.session.feedCode,
        symbol: detail.session.symbol,
        timeframe: detail.session.interval,
        to: detail.session.lastEvaluatedBarTime,
        limit: CANDLE_CHART_WINDOW_LIMIT,
        latest: true
      })
      .pipe(finalize(() => this.candleLoading.set(false)))
      .subscribe({
        next: (candles) => this.candles.set(candles),
        error: () => this.candles.set([])
      });
  }

  loadMoreCandles(event: CandleChartRangeBoundaryEvent): void {
    const detail = this.detail();
    if (!detail || this.candleLoading()) {
      return;
    }
    const window = buildAdjacentCandleWindow({
      direction: event.direction,
      timeframe: detail.session.interval,
      firstOpenTime: event.firstCandle?.openTime ?? event.firstCandle?.time,
      lastOpenTime: event.lastCandle?.openTime ?? event.lastCandle?.time,
      maxTime: detail.session.lastEvaluatedBarTime,
      limit: CANDLE_CHART_WINDOW_LIMIT
    });
    if (!window) {
      return;
    }
    this.candleLoading.set(true);
    this.marketDataService
      .getCandles({
        source: detail.session.source,
        marketType: detail.session.marketType,
        feedCode: detail.session.feedCode,
        symbol: detail.session.symbol,
        timeframe: detail.session.interval,
        ...window
      })
      .pipe(finalize(() => this.candleLoading.set(false)))
      .subscribe({
        next: (candles) => this.candles.set(mergeCandlesByOpenTime(this.candles(), candles)),
        error: () => undefined
      });
  }

  private loadStrategyOptions(): void {
    this.tradingSystemService
      .getStrategyConfigs({ status: 'ACTIVE' })
      .pipe(catchError(() => of([])))
      .subscribe((strategies) => {
        this.strategyOptions.set(
          strategies.map((strategy) => ({
            label: `${strategy.code} - ${strategy.strategyVersion}`,
            value: strategy.code
          }))
        );
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
      .subscribe((state) => this.progress.set(state));
    this.taskStateService.getLatestState(taskType, taskId).subscribe((state) => {
      if (state) {
        this.progressStore.patch(state);
      }
    });
  }
}
