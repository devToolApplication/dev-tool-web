import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastService } from '@core/notifications/toast.service';
import { QuantBacktestApiService } from '../../api/quant-backtest-api.service';
import type { QuantRunDetailDto } from '../../models/quant-backtest.dto';
import { RunDetailComponent } from './run-detail.component';

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: unknown): string {
    return String(value ?? '');
  }
}

const detail: QuantRunDetailDto = {
  runId: 'job-run-1',
  jobConfigCode: 'quant-backtest-run-1',
  name: 'BTC test',
  executionMode: 'RUN_NOW',
  status: 'SUCCEEDED',
  jobStatus: 'SUCCESS',
  triggerType: 'MANUAL',
  startedAt: '2026-09-08T00:00:00.000Z',
  finishedAt: '2026-09-08T00:15:00.000Z',
  durationMs: 900000,
  strategyId: 'ict_liquidity_reversal',
  strategyConfigId: 'ict-default',
  datasetVersion: 'dataset-1',
  instrumentIds: ['BTCUSDT-PERP'],
  start: '2026-01-01T00:00:00.000Z',
  end: '2026-01-31T23:59:00.000Z',
  initialCapital: '250000',
  simulationConfiguration: {
    intrabarPolicy: 'CONSERVATIVE_STOP_FIRST',
    feeModel: 'BINANCE_USDM_V1',
    slippageModel: 'FIXED_BPS',
    slippageBps: '1',
  },
  parameters: { swingLeftBars: 3 },
  backtestRunId: 'quant-run-1',
  quantOutcome: 'COMPLETED',
  quantStatus: 'COMPLETED',
  summaryMetrics: {
    totalReturn: 0.15,
    maxDrawdown: -0.02,
    sharpe: 1.7,
    winRate: 0.6,
    totalTrades: 12,
  },
  error: null,
};

describe('RunDetailComponent', () => {
  let component: RunDetailComponent;
  let fixture: ComponentFixture<RunDetailComponent>;
  let apiService: {
    getRunDetail: ReturnType<typeof vi.fn>;
    getMetrics: ReturnType<typeof vi.fn>;
    getEquity: ReturnType<typeof vi.fn>;
    getTrades: ReturnType<typeof vi.fn>;
    getOrders: ReturnType<typeof vi.fn>;
    getSignals: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let toast: { error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    apiService = {
      getRunDetail: vi.fn().mockReturnValue(of(detail)),
      getMetrics: vi.fn().mockReturnValue(
        of({
          runId: 'job-run-1',
          backtestRunId: 'quant-run-1',
          quantOutcome: 'COMPLETED',
          metrics: {
            runId: 'quant-run-1',
            totalReturn: 0.15,
            cagr: 0.12,
            sharpe: 1.72,
            sortino: 2.1,
            maxDrawdown: -0.02,
            winRate: 0.6,
            profitFactor: 1.8,
            totalTrades: 12,
          },
        }),
      ),
      getEquity: vi.fn().mockReturnValue(
        of({
          runId: 'job-run-1',
          backtestRunId: 'quant-run-1',
          data: [
            {
              runId: 'quant-run-1',
              timestamp: '2026-01-01T00:00:00.000Z',
              equity: 250000,
              drawdown: 0,
              cash: 250000,
            },
          ],
          metadata: { nextCursor: 'equity-2', hasMore: true },
          quantOutcome: 'COMPLETED',
        }),
      ),
      getTrades: vi.fn().mockReturnValue(
        of({
          runId: 'job-run-1',
          backtestRunId: 'quant-run-1',
          data: [
            {
              runId: 'quant-run-1',
              tradeId: 'trade-1',
              instrumentId: 'BTCUSDT-PERP',
              side: 'LONG',
              entryTime: '2026-01-02T00:00:00.000Z',
              entryPrice: 94000,
              quantity: 1,
              fees: 10,
              reasons: [],
            },
          ],
          metadata: { nextCursor: 'trade-2', hasMore: true },
          quantOutcome: 'COMPLETED',
        }),
      ),
      getOrders: vi.fn().mockReturnValue(
        of({
          runId: 'job-run-1',
          data: [
            {
              runId: 'quant-run-1',
              orderId: 'order-1',
              clientOrderId: 'client-1',
              instrumentId: 'BTCUSDT-PERP',
              side: 'BUY',
              type: 'LIMIT',
              status: 'FILLED',
              price: 94000,
              quantity: 1,
              filledQuantity: 1,
              submittedAt: '2026-01-02T00:00:00.000Z',
              filledAt: '2026-01-02T00:01:00.000Z',
            },
          ],
          metadata: { nextCursor: 'order-cursor-2', hasMore: true },
          quantOutcome: 'COMPLETED',
        }),
      ),
      getSignals: vi.fn().mockReturnValue(
        of({
          runId: 'job-run-1',
          data: [
            {
              runId: 'quant-run-1',
              signalId: 'sig-1',
              instrumentId: 'BTCUSDT-PERP',
              timestamp: '2026-01-02T00:00:00.000Z',
              action: 'BUY',
              strength: 0.9,
              metadata: {},
            },
          ],
          metadata: { nextCursor: 'sig-cursor-2', hasMore: true },
          quantOutcome: 'COMPLETED',
        }),
      ),
    };
    router = { navigate: vi.fn().mockResolvedValue(true) };
    toast = { error: vi.fn() };

    await TestBed.configureTestingModule({
      declarations: [RunDetailComponent, TranslateContentPipeStub],
      providers: [
        { provide: QuantBacktestApiService, useValue: apiService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'job-run-1' } } },
        },
        { provide: ToastService, useValue: toast },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(RunDetailComponent);
    component = fixture.componentInstance;
  });

  it('creates the component and loads detail, metrics, equity, and trades', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.runId()).toBe('job-run-1');
    expect(component.runDetail()?.runId).toBe('job-run-1');
    expect(component.metrics()?.totalReturn).toBe(0.15);
    expect(component.equityPoints()).toHaveLength(1);
    expect(component.trades()).toHaveLength(1);
  });

  it('maps summary metrics into KPI cards', () => {
    fixture.detectChanges();
    expect(component.metrics()?.sharpe).toBe(1.72);
    expect(component.metrics()?.winRate).toBe(0.6);
    expect(component.metrics()?.totalTrades).toBe(12);
  });

  it('updates active tab and loads tab data', () => {
    fixture.detectChanges();
    component.onTabChange('orders');
    expect(component.activeTab()).toBe('orders');
    expect(apiService.getOrders).toHaveBeenCalledWith('job-run-1', undefined);
  });

  it('preserves loaded rows and surfaces error when subsequent cursor page fails', () => {
    fixture.detectChanges();
    apiService.getTrades.mockReturnValueOnce(
      throwError(() => ({
        error: {
          traceId: 'trace-tab',
          path: '/v1/quant-backtest/runs/job-run-1/trades',
          status: 503,
          errorMessage: 'Quant unavailable',
          data: {
            code: 'PROVIDER_UNAVAILABLE',
            message: 'Quant unavailable',
            fieldErrors: [],
          },
        },
      })),
    );

    component.loadMoreTrades();
    expect(component.trades()).toHaveLength(1);
    expect(component.tradesError()).toBe('Quant unavailable');
    expect(component.tradesErrorCode()).toBe('PROVIDER_UNAVAILABLE');
    expect(component.tradesCorrelationId()).toBe('trace-tab');
  });

  it('retries a failed cursor page with the same cursor and appends to loaded rows', () => {
    fixture.detectChanges();
    apiService.getTrades.mockReturnValueOnce(
      throwError(() => ({
        error: {
          data: {
            code: 'PROVIDER_UNAVAILABLE',
            message: 'Quant unavailable',
            correlationId: 'corr-trades-retry',
            fieldErrors: [],
          },
        },
      })),
    );
    apiService.getTrades.mockReturnValueOnce(
      of({
        runId: 'job-run-1',
        backtestRunId: 'quant-run-1',
        data: [
          {
            runId: 'quant-run-1',
            tradeId: 'trade-retry',
            instrumentId: 'BTCUSDT-PERP',
            side: 'SHORT',
            entryTime: '2026-01-03T00:00:00.000Z',
            entryPrice: 95000,
            quantity: 1,
            fees: 10,
            reasons: [],
          },
        ],
        metadata: { nextCursor: null, hasMore: false },
        quantOutcome: 'COMPLETED',
      }),
    );

    component.loadMoreTrades();
    expect(component.trades().map((trade) => trade.tradeId)).toEqual(['trade-1']);
    expect(component.tradesError()).toBe('Quant unavailable');
    expect(component.tradesCorrelationId()).toBe('corr-trades-retry');

    component.retryTrades();

    expect(apiService.getTrades).toHaveBeenLastCalledWith('job-run-1', 'trade-2');
    expect(component.trades().map((trade) => trade.tradeId)).toEqual(['trade-1', 'trade-retry']);
    expect(component.tradesError()).toBeNull();
  });

  it('retries an empty tab from the initial cursor and does not classify it as partial data', () => {
    component.runId.set('job-run-1');
    component.trades.set([]);
    component.tradesNextCursor.set(null);
    component.tradesHasMore.set(false);
    apiService.getTrades.mockReturnValueOnce(
      throwError(() => ({
        error: {
          data: {
            code: 'RESULT_UNAVAILABLE',
            message: 'Trades unavailable',
            fieldErrors: [],
          },
        },
      })),
    );

    component.retryTrades();

    expect(apiService.getTrades).toHaveBeenLastCalledWith('job-run-1', undefined);
    expect(component.trades()).toEqual([]);
    expect(component.tradesError()).toBe('Trades unavailable');
  });

  it('retries a failed equity cursor page without dropping rendered points', () => {
    fixture.detectChanges();
    apiService.getEquity.mockReturnValueOnce(
      throwError(() => ({
        error: {
          data: {
            code: 'PROVIDER_UNAVAILABLE',
            message: 'Equity unavailable',
            correlationId: 'trace-equity-503',
            fieldErrors: [],
          },
        },
      })),
    );
    apiService.getEquity.mockReturnValueOnce(
      of({
        runId: 'job-run-1',
        backtestRunId: 'quant-run-1',
        data: [
          {
            runId: 'quant-run-1',
            timestamp: '2026-01-31T23:59:00.000Z',
            equity: 287500,
            drawdown: -0.02,
            cash: 287500,
          },
        ],
        metadata: { nextCursor: null, hasMore: false },
        quantOutcome: 'COMPLETED',
      }),
    );

    component.loadMoreEquity();
    expect(component.equityPoints()).toHaveLength(1);
    expect(component.equityError()).toBe('Equity unavailable');
    expect(component.equityErrorCode()).toBe('PROVIDER_UNAVAILABLE');
    expect(component.equityCorrelationId()).toBe('trace-equity-503');

    component.retryEquity();

    expect(apiService.getEquity).toHaveBeenLastCalledWith('job-run-1', 'equity-2');
    expect(component.equityPoints()).toHaveLength(2);
    expect(component.equityError()).toBeNull();
  });

  it('keeps metrics failures partial instead of failing the whole detail page', () => {
    apiService.getMetrics.mockReturnValue(
      throwError(() => ({
        error: {
          data: {
            code: 'QUANT_RESULT_UNAVAILABLE',
            message: 'Metrics unavailable',
            correlationId: 'trace-metrics-404',
            fieldErrors: [],
          },
        },
      })),
    );
    fixture.detectChanges();
    expect(component.runDetail()?.runId).toBe('job-run-1');
    expect(component.metrics()).toBeNull();
    expect(component.metricsError()).toBe('Metrics unavailable');
    expect(component.metricsErrorCode()).toBe('QUANT_RESULT_UNAVAILABLE');
    expect(component.metricsCorrelationId()).toBe('trace-metrics-404');
  });

  it('loads orders and signals only when their tabs are selected', () => {
    fixture.detectChanges();
    component.onTabChange('orders');
    component.onTabChange('signals');
    expect(apiService.getOrders).toHaveBeenCalledWith('job-run-1', undefined);
    expect(apiService.getSignals).toHaveBeenCalledWith('job-run-1', undefined);
  });

  it('formats error message with backend code and correlationId', () => {
    expect(component.formatErrorMessage('Service failure', 'QUANT_DOWN', 'corr-abc')).toBe(
      '[QUANT_DOWN] Service failure (Correlation: corr-abc)',
    );
    expect(component.formatErrorMessage('Service failure', 'QUANT_DOWN')).toBe(
      '[QUANT_DOWN] Service failure',
    );
    expect(component.formatErrorMessage('Simple failure', null)).toBe('Simple failure');
    expect(component.formatErrorMessage(null, null)).toBe('');
  });

  it('surfaces backend code and correlationId for partial orders error while preserving loaded rows, and retries with cursor', () => {
    fixture.detectChanges();
    component.onTabChange('orders');
    expect(component.orders()).toHaveLength(1);

    apiService.getOrders.mockReturnValueOnce(
      throwError(() => ({
        error: {
          data: {
            code: 'QUANT_ORDERS_TIMEOUT',
            message: 'Orders timeout',
            correlationId: 'trace-orders-timeout',
            fieldErrors: [],
          },
        },
      })),
    );
    apiService.getOrders.mockReturnValueOnce(
      of({
        runId: 'job-run-1',
        data: [
          {
            runId: 'quant-run-1',
            orderId: 'order-2',
            clientOrderId: 'client-2',
            instrumentId: 'BTCUSDT-PERP',
            side: 'SELL',
            type: 'MARKET',
            status: 'FILLED',
            price: 95000,
            quantity: 1,
            filledQuantity: 1,
            submittedAt: '2026-01-03T00:00:00.000Z',
            filledAt: '2026-01-03T00:01:00.000Z',
          },
        ],
        metadata: { nextCursor: null, hasMore: false },
        quantOutcome: 'COMPLETED',
      }),
    );

    component.loadMoreOrders();
    expect(component.orders()).toHaveLength(1);
    expect(component.ordersError()).toBe('Orders timeout');
    expect(component.ordersErrorCode()).toBe('QUANT_ORDERS_TIMEOUT');
    expect(component.ordersCorrelationId()).toBe('trace-orders-timeout');

    component.retryOrders();
    expect(apiService.getOrders).toHaveBeenLastCalledWith('job-run-1', 'order-cursor-2');
    expect(component.orders()).toHaveLength(2);
    expect(component.ordersError()).toBeNull();
  });

  it('surfaces backend code and correlationId for partial signals error while preserving loaded rows, and retries with cursor', () => {
    fixture.detectChanges();
    component.onTabChange('signals');
    expect(component.signals()).toHaveLength(1);

    apiService.getSignals.mockReturnValueOnce(
      throwError(() => ({
        error: {
          data: {
            code: 'QUANT_SIGNALS_TIMEOUT',
            message: 'Signals timeout',
            correlationId: 'trace-signals-timeout',
            fieldErrors: [],
          },
        },
      })),
    );
    apiService.getSignals.mockReturnValueOnce(
      of({
        runId: 'job-run-1',
        data: [
          {
            runId: 'quant-run-1',
            signalId: 'sig-2',
            instrumentId: 'BTCUSDT-PERP',
            timestamp: '2026-01-03T00:00:00.000Z',
            action: 'SELL',
            strength: 0.8,
            metadata: {},
          },
        ],
        metadata: { nextCursor: null, hasMore: false },
        quantOutcome: 'COMPLETED',
      }),
    );

    component.loadMoreSignals();
    expect(component.signals()).toHaveLength(1);
    expect(component.signalsError()).toBe('Signals timeout');
    expect(component.signalsErrorCode()).toBe('QUANT_SIGNALS_TIMEOUT');
    expect(component.signalsCorrelationId()).toBe('trace-signals-timeout');

    component.retrySignals();
    expect(apiService.getSignals).toHaveBeenLastCalledWith('job-run-1', 'sig-cursor-2');
    expect(component.signals()).toHaveLength(2);
    expect(component.signalsError()).toBeNull();
  });

  it('localizes run-detail enum values for trades, orders, and signals', () => {
    expect(component.getTradeSideI18nKey('LONG')).toBe('quantBacktest.side.LONG');
    expect(component.getTradeSideI18nKey('SHORT')).toBe('quantBacktest.side.SHORT');

    expect(component.getOrderSideI18nKey('BUY')).toBe('quantBacktest.side.BUY');
    expect(component.getOrderSideI18nKey('SELL')).toBe('quantBacktest.side.SELL');

    expect(component.getOrderStatusI18nKey('FILLED')).toBe('quantBacktest.orderStatus.FILLED');
    expect(component.getOrderStatusI18nKey('SUBMITTED')).toBe(
      'quantBacktest.orderStatus.SUBMITTED',
    );
    expect(component.getOrderStatusI18nKey('CANCELED')).toBe('quantBacktest.orderStatus.CANCELED');
    expect(component.getOrderStatusI18nKey('REJECTED')).toBe('quantBacktest.orderStatus.REJECTED');

    expect(component.getOrderStatusVariant('FILLED')).toBe('success');
    expect(component.getOrderStatusVariant('REJECTED')).toBe('danger');
    expect(component.getOrderStatusVariant('CANCELED')).toBe('muted');

    expect(component.getSignalActionI18nKey('BUY')).toBe('quantBacktest.signalAction.BUY');
    expect(component.getSignalActionI18nKey('SELL')).toBe('quantBacktest.signalAction.SELL');
    expect(component.getSignalActionI18nKey('CLOSE')).toBe('quantBacktest.signalAction.CLOSE');
    expect(component.getSignalActionI18nKey('HOLD')).toBe('quantBacktest.signalAction.HOLD');

    expect(component.getSignalActionVariant('BUY')).toBe('success');
    expect(component.getSignalActionVariant('SELL')).toBe('danger');
    expect(component.getSignalActionVariant('CLOSE')).toBe('warning');
    expect(component.getSignalActionVariant('HOLD')).toBe('info');
  });
});
