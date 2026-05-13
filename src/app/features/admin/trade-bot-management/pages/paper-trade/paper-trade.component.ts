import { Component, DestroyRef, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import { RealtimeTaskType } from '../../../../../core/models/realtime/realtime.model';
import { RealtimeTaskStateService } from '../../../../../core/services/realtime/realtime-task-state.service';
import { RealtimeWebSocketService } from '../../../../../core/services/realtime/realtime-websocket.service';
import { TaskProgressStoreService } from '../../../../../core/services/realtime/task-progress-store.service';
import { MarketDataService } from '../../../../../core/services/trade-bot-service/market-data.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { CandleChartConfig, ChartCandle, ChartOverlay } from '../../shared-trading/candle-chart/candle-chart';
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

  readonly accountForm: FormConfig = {
    fields: [
      { name: 'name', label: 'tradeBot.paper.accountName', type: 'text', width: '1/3' },
      { name: 'baseCurrency', label: 'tradeBot.paper.baseCurrency', type: 'text', width: '1/6' },
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
      { name: 'strategyCode', label: 'tradeBot.field.strategyCode', type: 'text', width: '1/3' },
      { name: 'symbol', label: 'tradeBot.field.symbol', type: 'text', width: '1/6' },
      { name: 'interval', label: 'tradeBot.field.timeframe', type: 'text', width: '1/6' },
      { name: 'source', label: 'tradeBot.field.source', type: 'text', width: '1/4' },
      { name: 'marketType', label: 'tradeBot.field.marketType', type: 'text', width: '1/4' },
      { name: 'feedCode', label: 'tradeBot.field.feedCode', type: 'text', width: '1/4' },
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
      { field: 'status', header: 'tradeBot.field.status' },
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
    minWidth: '78rem'
  };

  readonly orderTableConfig: TableConfig = {
    title: 'tradeBot.paper.orders',
    columns: [
      { field: 'filledAt', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' },
      { field: 'orderId', header: 'tradeBot.field.orderId', minWidth: '18rem' },
      { field: 'side', header: 'tradeBot.field.side' },
      { field: 'status', header: 'tradeBot.field.status' },
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
      { field: 'positionId', header: 'tradeBot.field.positionId', minWidth: '18rem' },
      { field: 'side', header: 'tradeBot.field.side' },
      { field: 'status', header: 'tradeBot.field.status' },
      { field: 'entryPrice', header: 'tradeBot.field.entryPrice', type: 'number' },
      { field: 'markPrice', header: 'tradeBot.paper.markPrice', type: 'number' },
      { field: 'stopLoss', header: 'tradeBot.paper.stopLoss', type: 'number' },
      { field: 'takeProfit', header: 'tradeBot.paper.takeProfit', type: 'number' },
      { field: 'quantity', header: 'tradeBot.field.quantity', type: 'number' }
    ],
    pagination: true,
    rows: 8,
    scrollable: true,
    minWidth: '90rem'
  };

  readonly eventTableConfig: TableConfig = {
    title: 'tradeBot.paper.events',
    columns: [
      { field: 'eventTime', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' },
      { field: 'eventType', header: 'tradeBot.field.type', minWidth: '13rem' },
      { field: 'message', header: 'tradeBot.field.message', minWidth: '18rem' },
      { field: 'traceId', header: 'traceId', minWidth: '18rem' }
    ],
    pagination: true,
    rows: 8,
    scrollable: true,
    minWidth: '80rem'
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
    height: 520
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
      color: order.side === 'BUY' ? '#16a34a' : '#dc2626',
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
        color: '#dc2626'
      },
      {
        id: `${position.positionId}-tp`,
        type: 'PRICE_LINE',
        source: 'PAPER_TRADE',
        price: Number(position.takeProfit ?? 0),
        text: 'TP',
        color: '#16a34a'
      }
    ])
  ]);

  constructor(
    private readonly store: PaperTradeStoreService,
    private readonly api: PaperTradeApiService,
    private readonly marketDataService: MarketDataService,
    private readonly realtimeWebSocketService: RealtimeWebSocketService,
    private readonly progressStore: TaskProgressStoreService,
    private readonly taskStateService: RealtimeTaskStateService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService,
    private readonly destroyRef: DestroyRef
  ) {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.loadingService
      .track(forkJoin({ accounts: this.api.getAccounts(), sessions: this.api.getSessions({ limit: 50 }) }))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ accounts, sessions }) => {
          this.store.accounts.set(accounts);
          this.store.sessions.set(sessions);
          const activeSession = sessions.find((session) => session.status === 'RUNNING') ?? sessions[0];
          if (activeSession) {
            this.loadDetail(activeSession.sessionId);
          }
        },
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.loadFailed'))
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
          this.applyDetail(detail);
          this.watchProgress('PAPER_TRADE_SESSION', detail.session.sessionId);
          this.reload();
        },
        error: () => this.toastService.error(this.i18nService.t('tradeBot.paper.sessionFailed'))
      });
  }

  loadDetail(sessionId: string): void {
    this.loading.set(true);
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
          this.applyDetail(detail);
          this.orders.set(orders);
          this.fills.set(fills);
          this.positions.set(positions);
          this.equityCurve.set(equity);
          this.events.set(events);
          this.watchProgress('PAPER_TRADE_SESSION', detail.session.sessionId);
          this.loadCandles(detail);
        },
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.loadFailed'))
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

  stop(): void {
    if (!window.confirm(this.i18nService.t('tradeBot.paper.confirmStop'))) {
      return;
    }
    this.control('stop');
  }

  resetAccount(): void {
    const accountId = this.detail()?.account.id ?? this.accounts()[0]?.id;
    if (!accountId || !window.confirm(this.i18nService.t('tradeBot.paper.confirmReset'))) {
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

  snapshotJson(): string {
    return JSON.stringify(this.detail()?.snapshot ?? {}, null, 2);
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
    this.marketDataService
      .getCandles({
        source: detail.session.source,
        marketType: detail.session.marketType,
        feedCode: detail.session.feedCode,
        symbol: detail.session.symbol,
        timeframe: detail.session.interval,
        limit: 200
      })
      .subscribe({
        next: (candles) => this.candles.set(candles),
        error: () => this.candles.set([])
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
