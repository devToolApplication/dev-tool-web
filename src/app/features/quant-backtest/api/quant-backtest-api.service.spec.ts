import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../../enviroment/environment';
import type {
  BacktestCreateRequestDto,
  QuantBaseResponseDto,
  QuantMetricsResponseDto,
  QuantRunsPageResponseDto,
} from '../models/quant-backtest.dto';
import { QuantBacktestApiService } from './quant-backtest-api.service';

const baseUrl = `${environment.apiUrl.jobSchedulerUrl}/quant-backtest`;

function baseResponse<T>(path: string, data: T, status = 200): QuantBaseResponseDto<T> {
  return {
    traceId: 'trace-qbt-001',
    path,
    status,
    errorMessage: null,
    data,
  };
}

describe('QuantBacktestApiService', () => {
  let service: QuantBacktestApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), QuantBacktestApiService],
    });
    service = TestBed.inject(QuantBacktestApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('uses the configured absolute Job Service BFF URL', () => {
    expect(environment.apiUrl.jobSchedulerUrl).toBe(
      'https://api.169.58.153.62.nip.io/job-service/v1',
    );
  });

  it('unwraps the real BaseResponse runs envelope and sends no service token', () => {
    let result: QuantRunsPageResponseDto | undefined;
    service
      .getRuns({ page: 1, size: 15, keyword: 'BTC', status: 'SUCCESS' })
      .subscribe((response) => (result = response));

    const request = httpMock.expectOne(
      (candidate) =>
        candidate.url === `${baseUrl}/runs` &&
        candidate.params.get('page') === '1' &&
        candidate.params.get('size') === '15' &&
        candidate.params.get('keyword') === 'BTC' &&
        candidate.params.get('status') === 'SUCCESS',
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.has('X-Service-Token')).toBe(false);

    const page: QuantRunsPageResponseDto = {
      data: [
        {
          runId: 'job-run-1',
          jobConfigCode: 'quant-backtest-run-1',
          name: 'BTC test',
          strategyId: 'ict_liquidity_reversal',
          strategyConfigId: 'ict-default',
          datasetVersion: 'dataset-1',
          instrumentIds: ['BTCUSDT-PERP'],
          status: 'SUCCEEDED',
          jobStatus: 'SUCCESS',
          triggerType: 'MANUAL',
          startedAt: '2026-09-08T00:00:00.000Z',
          quantOutcome: 'COMPLETED',
          summaryMetrics: {
            totalReturn: 0.15,
            maxDrawdown: -0.02,
            sharpe: 1.7,
            winRate: 0.6,
            totalTrades: 12,
          },
        },
      ],
      metadata: {
        pageNumber: 1,
        pageSize: 15,
        totalElements: 1,
        totalPages: 1,
      },
      overview: {
        runningCount: 0,
        completedCount: 1,
        winRate: 0.6,
        netReturn: 0.15,
      },
    };
    request.flush(baseResponse('/v1/quant-backtest/runs', page));
    expect(result).toEqual(page);
    expect(result?.data[0]?.jobStatus).toBe('SUCCESS');
  });

  it('serializes dateFrom and dateTo as ISO query parameters', () => {
    service
      .getRuns({
        dateFrom: '2026-01-01T00:00:00.000Z',
        dateTo: '2026-01-31T23:59:00.000Z',
      })
      .subscribe();

    const request = httpMock.expectOne(
      (candidate) =>
        candidate.url === `${baseUrl}/runs` &&
        candidate.params.get('dateFrom') === '2026-01-01T00:00:00.000Z' &&
        candidate.params.get('dateTo') === '2026-01-31T23:59:00.000Z',
    );
    expect(request.request.method).toBe('GET');
    request.flush(
      baseResponse('/v1/quant-backtest/runs', {
        data: [],
        metadata: { pageNumber: 0, pageSize: 10, totalElements: 0, totalPages: 0 },
        overview: { runningCount: 0, completedCount: 0, winRate: 0, netReturn: 0 },
      }),
    );
  });

  it('adds the caller-provided stable Idempotency-Key to each create retry', () => {
    const payload: BacktestCreateRequestDto = {
      name: 'BTC test',
      executionMode: 'RUN_NOW',
      schedule: null,
      strategyId: 'ict_liquidity_reversal',
      strategyConfigId: 'ict-default',
      datasetVersion: 'dataset-1',
      instrumentIds: ['BTCUSDT-PERP'],
      start: '2026-01-01T00:00:00.000Z',
      end: '2026-01-31T23:59:00.000Z',
      initialCapital: '100000',
      simulationConfiguration: {
        intrabarPolicy: 'CONSERVATIVE_STOP_FIRST',
        feeModel: 'BINANCE_USDM_V1',
        slippageModel: 'FIXED_BPS',
        slippageBps: '1',
      },
      parameters: { swingLeftBars: 3 },
    };
    const key = 'qbt-ui-12345678';

    service.createRun(payload, key).subscribe();
    service.createRun(payload, key).subscribe();

    const requests = httpMock.match(`${baseUrl}/runs`);
    expect(requests).toHaveLength(2);
    for (const request of requests) {
      expect(request.request.method).toBe('POST');
      expect(request.request.headers.get('Idempotency-Key')).toBe(key);
      expect(request.request.headers.has('X-Service-Token')).toBe(false);
      request.flush(
        baseResponse(
          '/v1/quant-backtest/runs',
          {
            executionMode: 'RUN_NOW',
            jobConfigCode: 'quant-backtest-run-1',
            jobRunId: 'job-run-1',
            status: 'STARTED',
          },
          201,
        ),
      );
    }
  });

  it('unwraps the metrics response envelope without flattening metrics', () => {
    let result: QuantMetricsResponseDto | undefined;
    service.getMetrics('job-run-1').subscribe((response) => (result = response));

    const request = httpMock.expectOne(`${baseUrl}/runs/job-run-1/metrics`);
    const metricsResponse: QuantMetricsResponseDto = {
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
    };
    request.flush(baseResponse('/v1/quant-backtest/runs/job-run-1/metrics', metricsResponse));
    expect(result).toEqual(metricsResponse);
    expect(result?.metrics?.sharpe).toBe(1.72);
  });

  it('unwraps real cursor, strategy, strategy config, validation, and dataset envelopes', () => {
    service.getTrades('job-run-1', 'cursor-1', 20).subscribe();
    const trades = httpMock.expectOne(
      (request) =>
        request.url === `${baseUrl}/runs/job-run-1/trades` &&
        request.params.get('cursor') === 'cursor-1' &&
        request.params.get('limit') === '20',
    );
    trades.flush(
      baseResponse('/v1/quant-backtest/runs/job-run-1/trades', {
        runId: 'job-run-1',
        backtestRunId: 'quant-run-1',
        data: [],
        metadata: { nextCursor: 'cursor-2', hasMore: true },
        quantOutcome: 'COMPLETED' as const,
      }),
    );

    service.getStrategies().subscribe((strategies) => {
      expect(strategies[0]?.configs[0]?.configId).toBe('ict-default');
    });
    const strategies = httpMock.expectOne(`${baseUrl}/strategies`);
    strategies.flush(
      baseResponse('/v1/quant-backtest/strategies', {
        strategies: [
          {
            id: 'ict_liquidity_reversal',
            name: 'ICT Liquidity Reversal',
            description: 'ICT strategy',
            schema: {},
            fields: [],
            parameterFields: [],
            simulationFields: [],
            configs: [
              {
                configId: 'ict-default',
                strategyId: 'ict_liquidity_reversal',
                name: 'Default',
                parameters: {},
                dataRequirements: {},
                simulation: {},
              },
            ],
          },
        ],
      }),
    );

    service.getStrategyConfig('ict-default').subscribe();
    const config = httpMock.expectOne(`${baseUrl}/strategies/configs/ict-default`);
    config.flush(
      baseResponse('/v1/quant-backtest/strategies/configs/ict-default', {
        configId: 'ict-default',
        strategyId: 'ict_liquidity_reversal',
        name: 'Default',
        parameters: {},
        dataRequirements: {},
        simulation: {},
      }),
    );

    service
      .validateStrategyParameters({
        strategyId: 'ict_liquidity_reversal',
        strategyConfigId: 'ict-default',
        parameters: {},
      })
      .subscribe();
    const validation = httpMock.expectOne(`${baseUrl}/strategies/validate`);
    validation.flush(
      baseResponse('/v1/quant-backtest/strategies/validate', {
        valid: true,
        strategyId: 'ict_liquidity_reversal',
        name: 'ICT Liquidity Reversal',
        parameters: {},
        errors: [],
      }),
    );

    service.getReadyDatasets().subscribe((datasets) => {
      expect(datasets.items[0]?.instrumentIds).toEqual(['BTCUSDT-PERP']);
      expect(datasets.nextCursor).toBe('dataset-2');
      expect(datasets.hasMore).toBe(true);
    });
    const datasets = httpMock.expectOne(`${baseUrl}/datasets?status=READY`);
    datasets.flush(
      baseResponse('/v1/quant-backtest/datasets', {
        data: [
          {
            datasetVersion: 'dataset-1',
            provider: 'BINANCE',
            venue: 'BINANCE_USDM',
            assetClass: 'CRYPTO_FUTURES',
            instrumentIds: ['BTCUSDT-PERP'],
            timeframe: '1m',
            start: '2026-01-01T00:00:00.000Z',
            end: '2026-01-31T23:59:00.000Z',
            barCount: 44640,
            timezone: 'UTC',
            status: 'READY' as const,
            createdAt: '2026-02-01T00:00:00.000Z',
          },
        ],
        metadata: { nextCursor: 'dataset-2', hasMore: true },
      }),
    );
  });

  it('propagates a BaseResponse error body for mapper-level field handling', () => {
    let received: unknown;
    service.getRunDetail('missing').subscribe({
      error: (error) => (received = error),
    });

    const request = httpMock.expectOne(`${baseUrl}/runs/missing`);
    request.flush(
      {
        traceId: 'trace-qbt-error',
        path: '/v1/quant-backtest/runs/missing',
        status: 404,
        errorMessage: 'Backtest run not found',
        data: {
          code: 'RUN_NOT_FOUND',
          message: 'Backtest run not found',
          correlationId: 'trace-qbt-error',
          fieldErrors: [],
        },
      },
      { status: 404, statusText: 'Not Found' },
    );

    expect((received as { error?: { data?: { code?: string } } }).error?.data?.code).toBe(
      'RUN_NOT_FOUND',
    );
  });
});
