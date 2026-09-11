// ponytail: deterministic mock BFF router for E2E tests, add websocket live replay when live backtest streaming is supported.
import { Page, Route } from '@playwright/test';

export type JobRunStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED'
  | 'SKIPPED'
  | 'TIMEOUT'
  | 'CANCELED';

export type BffRunStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED' | 'CANCELED';
export type QuantOutcome = 'COMPLETED' | 'FAILED' | 'IN_PROGRESS' | 'UNAVAILABLE';
export type ExecutionMode = 'RUN_NOW' | 'SCHEDULE';
export type TriggerType = 'MANUAL' | 'SCHEDULED';

export interface QuantBaseResponseDto<T> {
  traceId: string;
  path: string;
  status: number;
  errorMessage: string | null;
  data: T | null;
}

export interface QuantFieldErrorDto {
  field: string;
  message: string;
}

export interface QuantBffErrorEnvelope {
  code: string;
  message: string;
  correlationId?: string;
  fieldErrors?: QuantFieldErrorDto[];
}

export interface QuantSummaryMetricsDto {
  totalReturn?: number;
  maxDrawdown?: number;
  sharpe?: number;
  sortino?: number;
  winRate?: number;
  profitFactor?: number;
  totalTrades: number;
}

export interface QuantErrorSummaryDto {
  code: string;
  message: string;
  correlationId?: string;
}

export interface QuantBacktestRunSummaryDto {
  runId: string;
  jobConfigCode: string;
  name?: string;
  strategyId?: string;
  strategyConfigId?: string;
  datasetVersion?: string;
  instrumentIds?: string[];
  status: BffRunStatus;
  jobStatus: JobRunStatus;
  triggerType: TriggerType;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  quantOutcome: QuantOutcome;
  quantStatus?: string;
  backtestRunId?: string;
  summaryMetrics?: QuantSummaryMetricsDto;
  quantError?: QuantErrorSummaryDto;
}

export interface QuantRunsOverviewDto {
  runningCount: number;
  completedCount: number;
  winRate?: number;
  netReturn?: number;
}

export interface PageMetadataDto {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface QuantRunsPageResponseDto {
  data: QuantBacktestRunSummaryDto[];
  metadata: PageMetadataDto;
  overview: QuantRunsOverviewDto;
}

export interface CreateQuantRunNowResponseDto {
  executionMode: 'RUN_NOW';
  jobConfigCode: string;
  jobRunId: string;
  status: 'STARTED';
  replayed?: boolean;
}

export interface CreateQuantScheduleResponseDto {
  executionMode: 'SCHEDULE';
  jobConfigCode: string;
  enabled: true;
  nextRunAt: string;
  replayed?: boolean;
}

export type BacktestCreateResponseDto =
  | CreateQuantRunNowResponseDto
  | CreateQuantScheduleResponseDto;

export interface QuantRunDetailDto {
  runId: string;
  jobConfigCode: string;
  name?: string;
  executionMode: ExecutionMode;
  status: BffRunStatus;
  jobStatus: JobRunStatus;
  triggerType: TriggerType;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  strategyId?: string;
  strategyConfigId?: string;
  datasetVersion?: string;
  instrumentIds?: string[];
  start?: string;
  end?: string;
  initialCapital?: string;
  simulationConfiguration?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  backtestRunId?: string;
  quantOutcome: QuantOutcome;
  quantStatus?: string;
  summaryMetrics?: QuantSummaryMetricsDto;
  quantError?: QuantErrorSummaryDto;
  error?: {
    code?: string;
    message?: string;
  } | null;
}

export interface CursorPageMetadataDto {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CursorPageResponseDto<T> {
  runId: string;
  backtestRunId?: string;
  data: T[];
  metadata: CursorPageMetadataDto;
  quantOutcome: QuantOutcome;
}

export interface QuantCollectionPageDto<T> {
  data: T[];
  metadata: CursorPageMetadataDto;
}

export interface QuantTradeDto {
  runId: string;
  tradeId: string;
  orderId?: string | null;
  instrumentId: string;
  side: 'LONG' | 'SHORT';
  entryTime: string;
  entryPrice: number;
  exitTime?: string | null;
  exitPrice?: number | null;
  exitReason?: string | null;
  quantity: number;
  pnlGross?: number | null;
  pnlNet?: number | null;
  fees: number;
  reasons: string[];
}

export interface QuantOrderDto {
  runId: string;
  orderId: string;
  instrumentId: string;
  side: 'BUY' | 'SELL';
  orderType: string;
  quantity: number;
  price?: number | null;
  status: string;
  timestamp: string;
}

export interface QuantSignalDto {
  runId: string;
  signalId: string;
  timestamp: string;
  instrumentId: string;
  action: 'BUY' | 'SELL' | 'CLOSE' | 'HOLD';
  strategyId: string;
  strength: number;
  metadata: Record<string, unknown>;
}

export interface QuantEquityPointDto {
  runId: string;
  timestamp: string;
  equity: number;
  drawdown: number;
  cash?: number | null;
}

export interface QuantMetricsDto {
  runId: string;
  totalReturn: number;
  cagr?: number | null;
  sharpe?: number | null;
  sortino?: number | null;
  maxDrawdown: number;
  winRate?: number | null;
  profitFactor?: number | null;
  totalTrades: number;
}

export interface QuantMetricsResponseDto {
  runId: string;
  backtestRunId?: string;
  quantOutcome: QuantOutcome;
  metrics: QuantMetricsDto | null;
}

export interface QuantStrategyFieldDto {
  name: string;
  label?: string;
  type?: string;
  description?: string;
  default?: unknown;
  required?: boolean;
  min_value?: number;
  max_value?: number;
  step?: number;
  options?: string[];
  [key: string]: unknown;
}

export interface QuantStrategyConfigDto {
  configId: string;
  strategyId: string;
  name: string;
  parameters: Record<string, unknown>;
  dataRequirements: Record<string, unknown>;
  simulation: Record<string, unknown>;
}

export interface QuantStrategyDto {
  id: string;
  name: string;
  description: string;
  schema: Record<string, unknown>;
  fields: QuantStrategyFieldDto[];
  parameterFields: QuantStrategyFieldDto[];
  simulationFields: QuantStrategyFieldDto[];
  configs: QuantStrategyConfigDto[];
}

export interface StrategyValidationResponseDto {
  valid: boolean;
  strategyId?: string;
  name?: string;
  parameters?: Record<string, unknown>;
  errors: QuantFieldErrorDto[];
}

export interface QuantDatasetDto {
  datasetVersion: string;
  provider: string;
  venue: string;
  assetClass: string;
  instrumentIds: string[];
  timeframe: string;
  start: string;
  end: string;
  barCount: number;
  timezone: string;
  status: 'READY';
  createdAt: string;
  completedAt?: string | null;
}

export interface CapturedBffRequest {
  url: string;
  pathname: string;
  method: string;
  headers: Record<string, string>;
  postData: unknown;
}

export interface MockHttpErrorConfig {
  endpoint: string;
  exact?: boolean;
  status: number;
  envelope: {
    code: string;
    message: string;
    correlationId: string;
    fieldErrors?: Array<{ field: string; message: string }>;
  };
}

export interface MockBffState {
  capturedRequests: CapturedBffRequest[];
  createdRuns: Array<{ body: unknown; idempotencyKey?: string; timestamp: string }>;
  createdSchedules: Array<{ body: unknown; idempotencyKey?: string; timestamp: string }>;
  strategyValidations: Array<{ body: unknown; timestamp: string }>;
  runs: Array<QuantBacktestRunSummaryDto>;
  idempotentSubmissions: Map<string, { body: unknown; response: BacktestCreateResponseDto }>;
  paginateDatasets?: boolean;
  datasetCursorError?: boolean;
  simulateMissingQuantResult: boolean;
  simulateNetworkErrorForEndpoint?: string;
  simulateHttpError?: MockHttpErrorConfig;
}

export const mockSummaryMetrics: QuantRunsOverviewDto = {
  runningCount: 1,
  completedCount: 18,
  winRate: 0.6428,
  netReturn: 0.1945,
};

export const mockBacktestRuns: QuantBacktestRunSummaryDto[] = [
  {
    runId: 'job-run-001',
    jobConfigCode: 'quant-backtest-run-01k49x8a',
    name: 'BTC Momentum Jan 2026',
    strategyId: 'ict_liquidity_reversal',
    strategyConfigId: 'ict-liquidity-reversal-default-v1',
    datasetVersion: 'binance-usdm-1m-202601-v1',
    instrumentIds: ['BTCUSDT-PERP'],
    status: 'SUCCEEDED',
    jobStatus: 'SUCCESS',
    triggerType: 'MANUAL',
    startedAt: '2026-09-09T08:00:00Z',
    finishedAt: '2026-09-09T08:05:30Z',
    durationMs: 330000,
    quantOutcome: 'COMPLETED',
    quantStatus: 'COMPLETED',
    backtestRunId: 'backtest-bt-001',
    summaryMetrics: {
      totalReturn: 0.1485,
      maxDrawdown: -0.0421,
      sharpe: 2.14,
      winRate: 0.6428,
      profitFactor: 1.82,
      totalTrades: 42,
    },
  },
  {
    runId: 'job-run-002',
    jobConfigCode: 'quant-backtest-sched-01k49x8b',
    name: 'ETH Scheduled Daily Sweep',
    strategyId: 'ict_liquidity_reversal',
    strategyConfigId: 'ict-liquidity-reversal-default-v1',
    datasetVersion: 'binance-usdm-1m-202601-v1',
    instrumentIds: ['ETHUSDT-PERP'],
    status: 'RUNNING',
    jobStatus: 'RUNNING',
    triggerType: 'SCHEDULED',
    startedAt: '2026-09-09T09:00:00Z',
    quantOutcome: 'IN_PROGRESS',
    quantStatus: 'RUNNING',
  },
  {
    runId: 'job-run-003',
    jobConfigCode: 'quant-backtest-run-01k49x8c',
    name: 'SOL Out-of-Sample Failure',
    strategyId: 'ict_liquidity_reversal',
    strategyConfigId: 'ict-liquidity-reversal-default-v1',
    datasetVersion: 'binance-usdm-1m-202601-v1',
    instrumentIds: ['SOLUSDT-PERP'],
    status: 'FAILED',
    jobStatus: 'FAILED',
    triggerType: 'MANUAL',
    startedAt: '2026-09-09T07:15:00Z',
    finishedAt: '2026-09-09T07:16:10Z',
    durationMs: 70000,
    quantOutcome: 'FAILED',
    quantStatus: 'FAILED',
    quantError: {
      code: 'ENGINE_OUT_OF_MEMORY',
      message: 'Quant simulation engine exceeded memory limits during tick processing',
    },
  },
  {
    runId: 'job-run-004-missing-result',
    jobConfigCode: 'quant-backtest-run-01k49x8d',
    name: 'Job Succeeded Result Pending',
    strategyId: 'ict_liquidity_reversal',
    strategyConfigId: 'ict-liquidity-reversal-default-v1',
    datasetVersion: 'binance-usdm-1m-202601-v1',
    instrumentIds: ['BTCUSDT-PERP'],
    status: 'SUCCEEDED',
    jobStatus: 'SUCCESS',
    triggerType: 'MANUAL',
    startedAt: '2026-09-09T09:30:00Z',
    finishedAt: '2026-09-09T09:32:00Z',
    durationMs: 120000,
    quantOutcome: 'UNAVAILABLE',
    quantStatus: 'UNAVAILABLE',
  },
];

export const mockDatasets: Array<Record<string, unknown>> = [
  {
    datasetVersion: 'binance-usdm-1m-202601-v1',
    provider: 'BINANCE',
    venue: 'USDM_FUTURES',
    assetClass: 'CRYPTO',
    instrumentIds: ['BTCUSDT-PERP', 'ETHUSDT-PERP', 'SOLUSDT-PERP'],
    timeframe: '1m',
    start: '2026-01-01T00:00:00Z',
    end: '2026-01-31T23:59:00Z',
    barCount: 44640,
    timezone: 'UTC',
    status: 'READY',
    createdAt: '2026-01-01T00:00:00Z',
    completedAt: '2026-01-31T23:59:00Z',
  },
  {
    datasetVersion: 'binance-usdm-1m-202602-v2',
    provider: 'BINANCE',
    venue: 'USDM_FUTURES',
    assetClass: 'CRYPTO',
    instrumentIds: ['BTCUSDT-PERP', 'ETHUSDT-PERP'],
    timeframe: '1m',
    start: '2026-02-01T00:00:00Z',
    end: '2026-02-28T23:59:00Z',
    barCount: 40320,
    timezone: 'UTC',
    status: 'READY',
    createdAt: '2026-02-01T00:00:00Z',
    completedAt: '2026-02-28T23:59:00Z',
  },
  {
    datasetVersion: 'binance-spot-1m-incomplete-v2',
    provider: 'BINANCE',
    venue: 'SPOT',
    assetClass: 'CRYPTO',
    instrumentIds: ['BTCUSDT'],
    timeframe: '1m',
    start: '2026-02-01T00:00:00Z',
    end: '2026-02-28T23:59:00Z',
    barCount: 20160,
    timezone: 'UTC',
    status: 'INGESTING',
    createdAt: '2026-02-01T00:00:00Z',
    completedAt: null,
  },
  {
    datasetVersion: 'binance-usdm-corrupt-v3',
    provider: 'BINANCE',
    venue: 'USDM_FUTURES',
    assetClass: 'CRYPTO',
    instrumentIds: ['DOGEUSDT-PERP'],
    timeframe: '1m',
    start: '2026-01-01T00:00:00Z',
    end: '2026-01-05T00:00:00Z',
    barCount: 120,
    timezone: 'UTC',
    status: 'FAILED',
    createdAt: '2026-01-01T00:00:00Z',
    completedAt: '2026-01-05T00:00:00Z',
  },
];
export const mockStrategies: QuantStrategyDto[] = [
  {
    id: 'ict_liquidity_reversal',
    name: 'ICT Liquidity Reversal',
    description:
      'Exploits liquidity pool sweeps with structural market reversal confirmation on 1m bars.',
    schema: {
      type: 'object',
      properties: {
        swing_left_bars: {
          type: 'integer',
          title: 'Swing Left Bars',
          default: 3,
          minimum: 1,
          maximum: 50,
        },
        swing_right_bars: {
          type: 'integer',
          title: 'Swing Right Bars',
          default: 3,
          minimum: 1,
          maximum: 50,
        },
        max_active_pools: {
          type: 'integer',
          title: 'Max Active Pools',
          default: 10,
          minimum: 1,
          maximum: 100,
        },
        choch_max_bars: {
          type: 'integer',
          title: 'CHoCH Max Bars',
          default: 12,
          minimum: 1,
          maximum: 100,
        },
        risk_per_trade: {
          type: 'number',
          title: 'Risk Per Trade',
          default: 0.01,
          minimum: 0.0001,
          maximum: 1.0,
        },
        risk_reward_ratio: {
          type: 'number',
          title: 'Risk/Reward Ratio',
          default: 2.0,
          minimum: 0.5,
          maximum: 20.0,
        },
      },
      required: [
        'swing_left_bars',
        'swing_right_bars',
        'max_active_pools',
        'choch_max_bars',
        'risk_per_trade',
        'risk_reward_ratio',
      ],
    },
    fields: [],
    parameterFields: [],
    simulationFields: [
      {
        name: 'initial_capital',
        label: 'Initial Capital',
        type: 'number',
        description: 'Starting cash balance for backtest simulation',
        default: 100000.0,
        required: true,
        min_value: 1.0,
      },
      {
        name: 'intrabar_policy',
        label: 'Intrabar Policy',
        type: 'select',
        description: 'Deterministic policy for intrabar execution',
        default: 'CONSERVATIVE_STOP_FIRST',
        required: true,
        options: ['CONSERVATIVE_STOP_FIRST'],
      },
      {
        name: 'fee_model',
        label: 'Fee Model',
        type: 'select',
        description: 'Fee schedule supported by the simulation configuration',
        default: 'BINANCE_USDM_V1',
        required: true,
        options: ['BINANCE_USDM_V1'],
      },
      {
        name: 'slippage_model',
        label: 'Slippage Model',
        type: 'select',
        description: 'Slippage model currently executed by the simulation engine',
        default: 'FIXED_BPS',
        required: true,
        options: ['FIXED_BPS'],
      },
      {
        name: 'slippage_bps',
        label: 'Slippage Basis Points',
        type: 'number',
        description: 'Fixed slippage in basis points',
        default: 1.0,
        required: false,
        min_value: 0.0,
        max_value: 100.0,
        step: 0.1,
      },
    ],
    configs: [
      {
        configId: 'ict-liquidity-reversal-default-v1',
        strategyId: 'ict_liquidity_reversal',
        name: 'Conservative Default',
        parameters: {
          swing_left_bars: 3,
          swing_right_bars: 3,
          max_active_pools: 10,
          choch_max_bars: 12,
          risk_per_trade: 0.01,
          risk_reward_ratio: 2.0,
        },
        dataRequirements: {
          base_timeframe: '1m',
          derived_timeframes: ['5m', '15m', '1h', '4h'],
        },
        simulation: {
          intrabar_policy: 'CONSERVATIVE_STOP_FIRST',
          fee_model: 'BINANCE_USDM_V1',
          slippage_model: 'FIXED_BPS',
        },
      },
      {
        configId: 'ict-liquidity-reversal-aggressive-v1',
        strategyId: 'ict_liquidity_reversal',
        name: 'Aggressive 5-Bar Pivot',
        parameters: {
          swing_left_bars: 5,
          swing_right_bars: 5,
          max_active_pools: 20,
          choch_max_bars: 8,
          risk_per_trade: 0.02,
          risk_reward_ratio: 2.5,
        },
        dataRequirements: {
          base_timeframe: '1m',
          derived_timeframes: ['5m', '15m'],
        },
        simulation: {
          intrabar_policy: 'CONSERVATIVE_STOP_FIRST',
          fee_model: 'BINANCE_USDM_V1',
          slippage_model: 'FIXED_BPS',
        },
      },
    ],
  },
];

export const mockRunMetrics: QuantMetricsDto = {
  runId: 'job-run-001',
  totalReturn: 0.1485,
  maxDrawdown: -0.0421,
  sharpe: 2.14,
  sortino: 2.85,
  winRate: 0.6428,
  profitFactor: 1.82,
  totalTrades: 42,
};

export const mockEquityPoints: QuantEquityPointDto[] = [
  {
    runId: 'job-run-001',
    timestamp: '2026-01-01T00:00:00Z',
    equity: 100000.0,
    drawdown: 0.0,
    cash: 100000.0,
  },
  {
    runId: 'job-run-001',
    timestamp: '2026-01-05T12:00:00Z',
    equity: 102450.0,
    drawdown: 0.0,
    cash: 102450.0,
  },
  {
    runId: 'job-run-001',
    timestamp: '2026-01-10T08:00:00Z',
    equity: 101200.0,
    drawdown: -0.0122,
    cash: 101200.0,
  },
  {
    runId: 'job-run-001',
    timestamp: '2026-01-15T18:00:00Z',
    equity: 106800.0,
    drawdown: 0.0,
    cash: 106800.0,
  },
  {
    runId: 'job-run-001',
    timestamp: '2026-01-20T04:00:00Z',
    equity: 104500.0,
    drawdown: -0.0215,
    cash: 104500.0,
  },
  {
    runId: 'job-run-001',
    timestamp: '2026-01-25T14:00:00Z',
    equity: 111200.0,
    drawdown: 0.0,
    cash: 111200.0,
  },
  {
    runId: 'job-run-001',
    timestamp: '2026-01-31T23:59:00Z',
    equity: 114850.0,
    drawdown: 0.0,
    cash: 114850.0,
  },
];

export const mockTradesPage1: QuantTradeDto[] = [
  {
    runId: 'job-run-001',
    tradeId: 'trd-001',
    orderId: 'ord-001',
    instrumentId: 'BTCUSDT-PERP',
    side: 'LONG',
    entryTime: '2026-01-02T10:05:00Z',
    entryPrice: 65200.0,
    exitTime: '2026-01-02T14:20:00Z',
    exitPrice: 66800.0,
    exitReason: 'TAKE_PROFIT',
    quantity: 1.5,
    pnlGross: 2400.0,
    pnlNet: 2385.2,
    fees: 14.8,
    reasons: ['FVG_ENTRY', 'TP_HIT'],
  },
  {
    runId: 'job-run-001',
    tradeId: 'trd-002',
    orderId: 'ord-002',
    instrumentId: 'BTCUSDT-PERP',
    side: 'SHORT',
    entryTime: '2026-01-04T08:15:00Z',
    entryPrice: 67100.0,
    exitTime: '2026-01-04T10:00:00Z',
    exitPrice: 67650.0,
    exitReason: 'STOP_LOSS',
    quantity: 1.0,
    pnlGross: -550.0,
    pnlNet: -560.1,
    fees: 10.1,
    reasons: ['LIQUIDITY_SWEEP', 'SL_HIT'],
  },
];

export const mockTradesPage2: QuantTradeDto[] = [
  {
    runId: 'job-run-001',
    tradeId: 'trd-003',
    orderId: 'ord-003',
    instrumentId: 'BTCUSDT-PERP',
    side: 'LONG',
    entryTime: '2026-01-07T11:00:00Z',
    entryPrice: 66400.0,
    exitTime: '2026-01-07T16:45:00Z',
    exitPrice: 68100.0,
    exitReason: 'TAKE_PROFIT',
    quantity: 1.2,
    pnlGross: 2040.0,
    pnlNet: 2027.7,
    fees: 12.3,
    reasons: ['MSS_CONFIRMATION', 'TP_HIT'],
  },
];

export const mockOrders: QuantOrderDto[] = [
  {
    runId: 'job-run-001',
    orderId: 'ord-001',
    instrumentId: 'BTCUSDT-PERP',
    side: 'BUY',
    orderType: 'LIMIT',
    price: 65200.0,
    quantity: 1.5,
    status: 'FILLED',
    timestamp: '2026-01-02T10:05:00Z',
  },
  {
    runId: 'job-run-001',
    orderId: 'ord-002',
    instrumentId: 'BTCUSDT-PERP',
    side: 'SELL',
    orderType: 'LIMIT',
    price: 66800.0,
    quantity: 1.5,
    status: 'FILLED',
    timestamp: '2026-01-02T14:20:00Z',
  },
];

export const mockSignals: QuantSignalDto[] = [
  {
    runId: 'job-run-001',
    signalId: 'sig-001',
    timestamp: '2026-01-02T10:04:00Z',
    instrumentId: 'BTCUSDT-PERP',
    action: 'BUY',
    strategyId: 'ict_liquidity_reversal',
    strength: 1.0,
    metadata: {
      sweepLevel: 65150.0,
      mssConfirmed: true,
      fvgFormed: true,
    },
  },
  {
    runId: 'job-run-001',
    signalId: 'sig-002',
    timestamp: '2026-01-04T08:14:00Z',
    instrumentId: 'BTCUSDT-PERP',
    action: 'SELL',
    strategyId: 'ict_liquidity_reversal',
    strength: 0.8,
    metadata: {
      sweepLevel: 67200.0,
      mssConfirmed: true,
      fvgFormed: false,
    },
  },
];

export const mockRunDetail001: QuantRunDetailDto = {
  runId: 'job-run-001',
  jobConfigCode: 'quant-backtest-run-01k49x8a',
  name: 'BTC Momentum Jan 2026',
  executionMode: 'RUN_NOW',
  status: 'SUCCEEDED',
  jobStatus: 'SUCCESS',
  triggerType: 'MANUAL',
  startedAt: '2026-09-09T08:00:00Z',
  finishedAt: '2026-09-09T08:05:30Z',
  durationMs: 330000,
  strategyId: 'ict_liquidity_reversal',
  strategyConfigId: 'ict-liquidity-reversal-default-v1',
  datasetVersion: 'binance-usdm-1m-202601-v1',
  instrumentIds: ['BTCUSDT-PERP'],
  start: '2026-01-01T00:00:00Z',
  end: '2026-01-31T23:59:00Z',
  initialCapital: '100000.00',
  simulationConfiguration: {
    intrabarPolicy: 'CONSERVATIVE_STOP_FIRST',
    feeModel: 'BINANCE_USDM_V1',
    slippageModel: 'FIXED_BPS',
    slippageBps: '1.0',
  },
  parameters: {
    swing_left_bars: 3,
    swing_right_bars: 3,
    max_active_pools: 10,
    choch_max_bars: 12,
    risk_per_trade: 0.01,
    risk_reward_ratio: 2.0,
  },
  backtestRunId: 'backtest-bt-001',
  quantOutcome: 'COMPLETED',
  quantStatus: 'COMPLETED',
  summaryMetrics: {
    totalReturn: 0.1485,
    maxDrawdown: -0.0421,
    sharpe: 2.14,
    winRate: 0.6428,
    profitFactor: 1.82,
    totalTrades: 42,
  },
};

export const mockRunDetail004MissingResult: QuantRunDetailDto = {
  runId: 'job-run-004-missing-result',
  jobConfigCode: 'quant-backtest-run-01k49x8d',
  name: 'Job Succeeded Result Pending',
  executionMode: 'RUN_NOW',
  status: 'SUCCEEDED',
  jobStatus: 'SUCCESS',
  triggerType: 'MANUAL',
  startedAt: '2026-09-09T09:30:00Z',
  finishedAt: '2026-09-09T09:32:00Z',
  durationMs: 120000,
  strategyId: 'ict_liquidity_reversal',
  strategyConfigId: 'ict-liquidity-reversal-default-v1',
  datasetVersion: 'binance-usdm-1m-202601-v1',
  instrumentIds: ['BTCUSDT-PERP'],
  start: '2026-01-01T00:00:00Z',
  end: '2026-01-31T23:59:00Z',
  initialCapital: '100000.00',
  simulationConfiguration: {
    intrabarPolicy: 'CONSERVATIVE_STOP_FIRST',
    feeModel: 'BINANCE_USDM_V1',
    slippageModel: 'FIXED_BPS',
    slippageBps: '1.0',
  },
  parameters: {
    swing_left_bars: 3,
    swing_right_bars: 3,
  },
  quantOutcome: 'UNAVAILABLE',
  quantStatus: 'UNAVAILABLE',
};
/**
 * Sets up mock handlers for Job Service BFF Quant Backtest endpoints.
 * Explicitly asserts that browser requests never transmit X-Service-Token.
 * All responses are wrapped in standard BaseResponse format.
 */
export async function setupQuantBacktestBffMock(
  page: Page,
  initialState?: Partial<MockBffState>,
): Promise<MockBffState> {
  const state: MockBffState = {
    capturedRequests: [],
    createdRuns: [],
    createdSchedules: [],
    strategyValidations: [],
    runs: [...mockBacktestRuns],
    idempotentSubmissions: new Map(),
    simulateMissingQuantResult: false,
    ...initialState,
  };

  await page.route('**/v1/quant-backtest/**', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const headers = request.headers();
    let postData: unknown = null;
    try {
      postData = request.postDataJSON();
    } catch {
      postData = null;
    }

    const captured: CapturedBffRequest = {
      url: request.url(),
      pathname: url.pathname,
      method,
      headers,
      postData,
    };
    state.capturedRequests.push(captured);

    // Strict QA Assertion: browser requests must NEVER transmit internal X-Service-Token
    const tokenHeader = Object.keys(headers).find((h) => h.toLowerCase() === 'x-service-token');
    if (tokenHeader) {
      await fulfillBaseError(
        route,
        url.pathname,
        'SECURITY_VIOLATION_INTERNAL_TOKEN_LEAK',
        'Browser request transmitted forbidden internal X-Service-Token',
        400,
      );
      return;
    }

    if (method === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET,POST,OPTIONS',
          'access-control-allow-headers': 'content-type,authorization,idempotency-key',
        },
      });
      return;
    }

    // Simulated custom error override
    if (state.simulateHttpError) {
      const isMatch = state.simulateHttpError.exact
        ? url.pathname.endsWith(state.simulateHttpError.endpoint)
        : url.pathname.includes(state.simulateHttpError.endpoint);
      if (isMatch) {
        await fulfillBaseError(
          route,
          url.pathname,
          state.simulateHttpError.envelope.code,
          state.simulateHttpError.envelope.message,
          state.simulateHttpError.status,
          state.simulateHttpError.envelope.fieldErrors,
          state.simulateHttpError.envelope.correlationId,
        );
        return;
      }
    }

    // GET /v1/quant-backtest/datasets
    if (method === 'GET' && url.pathname.endsWith('/datasets')) {
      const statusFilter = url.searchParams.get('status') || 'READY';
      const cursor = url.searchParams.get('cursor');

      if (state.datasetCursorError && cursor === 'dataset-cursor-page-2') {
        await fulfillBaseError(
          route,
          url.pathname,
          'DATASET_CURSOR_ERROR',
          'Failed to load paginated dataset cursor',
          500,
        );
        return;
      }

      const filtered = (statusFilter
        ? mockDatasets.filter((d) => d['status'] === statusFilter)
        : mockDatasets) as unknown as QuantDatasetDto[];

      if (state.paginateDatasets) {
        const isPage2 = cursor === 'dataset-cursor-page-2';
        const pageData = isPage2 ? filtered.slice(1) : filtered.slice(0, 1);
        await fulfillBaseResponse<QuantCollectionPageDto<QuantDatasetDto>>(route, url.pathname, {
          data: pageData,
          metadata: {
            nextCursor: isPage2 || filtered.length <= 1 ? null : 'dataset-cursor-page-2',
            hasMore: !isPage2 && filtered.length > 1,
          },
        });
        return;
      }

      await fulfillBaseResponse<QuantCollectionPageDto<QuantDatasetDto>>(route, url.pathname, {
        data: filtered,
        metadata: {
          nextCursor: null,
          hasMore: false,
        },
      });
      return;
    }

    // POST /v1/quant-backtest/strategies/validate
    if (method === 'POST' && url.pathname.endsWith('/strategies/validate')) {
      state.strategyValidations.push({ body: postData, timestamp: new Date().toISOString() });
      const body = postData as Record<string, unknown> | null;
      const params = (body?.['parameters'] || {}) as Record<string, unknown>;
      if (typeof params['swing_left_bars'] === 'number' && params['swing_left_bars'] <= 0) {
        await fulfillBaseResponse<StrategyValidationResponseDto>(
          route,
          url.pathname,
          {
            valid: false,
            strategyId: (body?.['strategyId'] as string) || 'ict_liquidity_reversal',
            errors: [
              { field: 'swing_left_bars', message: 'swing_left_bars must be greater than 0' },
            ],
          },
          200,
        );
        return;
      }
      await fulfillBaseResponse<StrategyValidationResponseDto>(route, url.pathname, {
        valid: true,
        strategyId: (body?.['strategyId'] as string) || 'ict_liquidity_reversal',
        name: 'ICT Liquidity Reversal',
        parameters: params,
        errors: [],
      });
      return;
    }

    // GET /v1/quant-backtest/strategies/configs/:configId
    const configMatch = url.pathname.match(/\/strategies\/configs\/([^/]+)$/);
    if (method === 'GET' && configMatch) {
      const configId = configMatch[1];
      const strategy = mockStrategies.find((s) => s.configs.some((c) => c.configId === configId));
      const foundConfig = strategy?.configs.find((c) => c.configId === configId);
      if (!foundConfig) {
        await fulfillBaseError(
          route,
          url.pathname,
          'STRATEGY_CONFIG_NOT_FOUND',
          `Config ${configId} not found`,
          404,
        );
        return;
      }
      await fulfillBaseResponse<QuantStrategyConfigDto>(route, url.pathname, foundConfig);
      return;
    }

    // GET /v1/quant-backtest/strategies
    if (method === 'GET' && url.pathname.endsWith('/strategies')) {
      await fulfillBaseResponse<{ strategies: QuantStrategyDto[] }>(route, url.pathname, {
        strategies: mockStrategies,
      });
      return;
    }

    // GET /v1/quant-backtest/runs/{runId}/metrics
    if (method === 'GET' && url.pathname.match(/\/runs\/[^/]+\/metrics$/)) {
      const runId = url.pathname.split('/')[4] || '';
      if (state.simulateMissingQuantResult || url.pathname.includes('job-run-004-missing-result')) {
        await fulfillBaseError(
          route,
          url.pathname,
          'QUANT_RESULT_UNAVAILABLE',
          'Quant backtest computation pending or result record not generated yet',
          404,
          undefined,
          'req-missing-metrics',
        );
        return;
      }
      await fulfillBaseResponse<QuantMetricsResponseDto>(route, url.pathname, {
        runId,
        backtestRunId: 'backtest-bt-001',
        quantOutcome: 'COMPLETED',
        metrics: mockRunMetrics,
      });
      return;
    }

    // GET /v1/quant-backtest/runs/{runId}/equity
    if (method === 'GET' && url.pathname.match(/\/runs\/[^/]+\/equity$/)) {
      const runId = url.pathname.split('/')[4] || '';
      if (state.simulateMissingQuantResult || url.pathname.includes('job-run-004-missing-result')) {
        await fulfillBaseError(
          route,
          url.pathname,
          'QUANT_RESULT_UNAVAILABLE',
          'Quant equity curve not available yet',
          404,
          undefined,
          'req-missing-equity',
        );
        return;
      }
      await fulfillBaseResponse<CursorPageResponseDto<QuantEquityPointDto>>(route, url.pathname, {
        runId,
        backtestRunId: 'backtest-bt-001',
        quantOutcome: 'COMPLETED',
        metadata: {
          nextCursor: null,
          hasMore: false,
        },
        data: mockEquityPoints,
      });
      return;
    }

    // GET /v1/quant-backtest/runs/{runId}/trades
    if (method === 'GET' && url.pathname.match(/\/runs\/[^/]+\/trades$/)) {
      const runId = url.pathname.split('/')[4] || '';
      const cursor = url.searchParams.get('cursor');
      const isPage2 = cursor === 'cursor-trade-token-page-2';
      await fulfillBaseResponse<CursorPageResponseDto<QuantTradeDto>>(route, url.pathname, {
        runId,
        backtestRunId: 'backtest-bt-001',
        quantOutcome: 'COMPLETED',
        metadata: {
          nextCursor: isPage2 ? null : 'cursor-trade-token-page-2',
          hasMore: !isPage2,
        },
        data: isPage2 ? mockTradesPage2 : mockTradesPage1,
      });
      return;
    }

    // GET /v1/quant-backtest/runs/{runId}/orders
    if (method === 'GET' && url.pathname.match(/\/runs\/[^/]+\/orders$/)) {
      const runId = url.pathname.split('/')[4] || '';
      await fulfillBaseResponse<CursorPageResponseDto<QuantOrderDto>>(route, url.pathname, {
        runId,
        backtestRunId: 'backtest-bt-001',
        quantOutcome: 'COMPLETED',
        metadata: {
          nextCursor: null,
          hasMore: false,
        },
        data: mockOrders,
      });
      return;
    }

    // GET /v1/quant-backtest/runs/{runId}/signals
    if (method === 'GET' && url.pathname.match(/\/runs\/[^/]+\/signals$/)) {
      const runId = url.pathname.split('/')[4] || '';
      await fulfillBaseResponse<CursorPageResponseDto<QuantSignalDto>>(route, url.pathname, {
        runId,
        backtestRunId: 'backtest-bt-001',
        quantOutcome: 'COMPLETED',
        metadata: {
          nextCursor: null,
          hasMore: false,
        },
        data: mockSignals,
      });
      return;
    }

    // GET /v1/quant-backtest/runs/{runId} (Single Run Detail)
    const runDetailMatch = url.pathname.match(/\/runs\/([^/]+)$/);
    if (method === 'GET' && runDetailMatch) {
      const requestedRunId = runDetailMatch[1];
      if (requestedRunId === 'job-run-001') {
        await fulfillBaseResponse<QuantRunDetailDto>(route, url.pathname, mockRunDetail001);
        return;
      }
      if (requestedRunId === 'job-run-004-missing-result') {
        await fulfillBaseResponse<QuantRunDetailDto>(
          route,
          url.pathname,
          mockRunDetail004MissingResult,
        );
        return;
      }
      const found = state.runs.find((r) => r['runId'] === requestedRunId);
      if (!found) {
        await fulfillBaseError(
          route,
          url.pathname,
          'RUN_NOT_FOUND',
          `Run ${requestedRunId} was not found`,
          404,
          undefined,
          'req-not-found',
        );
        return;
      }
      const detailFromSummary: QuantRunDetailDto = {
        runId: found.runId,
        jobConfigCode: found.jobConfigCode,
        name: found.name,
        executionMode: 'RUN_NOW',
        status: found.status,
        jobStatus: found.jobStatus,
        triggerType: found.triggerType,
        startedAt: found.startedAt,
        finishedAt: found.finishedAt,
        durationMs: found.durationMs,
        strategyId: found.strategyId,
        strategyConfigId: found.strategyConfigId,
        datasetVersion: found.datasetVersion,
        instrumentIds: found.instrumentIds,
        start: '2026-01-01T00:00:00Z',
        end: '2026-01-31T23:59:00Z',
        initialCapital: '100000.00',
        simulationConfiguration: {
          intrabarPolicy: 'CONSERVATIVE_STOP_FIRST',
          feeModel: 'BINANCE_USDM_V1',
          slippageModel: 'FIXED_BPS',
          slippageBps: '1.0',
        },
        parameters: {
          swing_left_bars: 3,
          swing_right_bars: 3,
        },
        backtestRunId: found.backtestRunId,
        quantOutcome: found.quantOutcome,
        quantStatus: found.quantStatus,
        summaryMetrics: found.summaryMetrics,
      };
      await fulfillBaseResponse<QuantRunDetailDto>(route, url.pathname, detailFromSummary);
      return;
    }

    // POST /v1/quant-backtest/runs (Create Run)
    if (method === 'POST' && url.pathname.endsWith('/runs')) {
      // Header verification: Idempotency-Key is required by BFF
      const idempotencyKey =
        headers['idempotency-key'] ||
        Object.entries(headers).find(([k]) => k.toLowerCase() === 'idempotency-key')?.[1];

      if (!idempotencyKey || idempotencyKey.length < 8) {
        await fulfillBaseError(
          route,
          url.pathname,
          'VALIDATION_ERROR',
          'Idempotency-Key header is required and must be at least 8 characters',
          400,
        );
        return;
      }

      const body = postData as Record<string, unknown> | null;
      const mode = body?.['executionMode'] || 'RUN_NOW';

      // Duplicate idempotency handling
      const existingSubmission = state.idempotentSubmissions.get(idempotencyKey);
      if (existingSubmission) {
        const existingBodyJson = JSON.stringify(existingSubmission.body);
        const incomingBodyJson = JSON.stringify(postData);
        if (existingBodyJson === incomingBodyJson) {
          await fulfillBaseResponse<BacktestCreateResponseDto>(
            route,
            url.pathname,
            { ...existingSubmission.response, replayed: true },
            200,
          );
          return;
        }
        await fulfillBaseError(
          route,
          url.pathname,
          'IDEMPOTENCY_KEY_REUSED',
          `Idempotency key ${idempotencyKey} was already used for a different request payload`,
          409,
        );
        return;
      }

      // Validation: initial capital must be positive
      const capital = Number(body?.['initialCapital']);
      if (isNaN(capital) || capital <= 0) {
        await fulfillBaseError(
          route,
          url.pathname,
          'INVALID_CAPITAL',
          'Initial capital must be a positive number',
          400,
          [{ field: 'initialCapital', message: 'Initial capital must be positive' }],
          'req-err-capital',
        );
        return;
      }

      // Boundary validation: Dataset status must be READY
      if (body?.['datasetVersion'] === 'binance-spot-1m-incomplete-v2') {
        await fulfillBaseError(
          route,
          url.pathname,
          'DATASET_NOT_READY',
          'Dataset binance-spot-1m-incomplete-v2 has status INGESTING and cannot be used for execution',
          400,
          undefined,
          'req-err-dataset',
        );
        return;
      }

      if (mode === 'SCHEDULE') {
        const scheduleResp: BacktestCreateResponseDto = {
          executionMode: 'SCHEDULE',
          jobConfigCode: `quant-backtest-sched-${Date.now().toString(36)}`,
          enabled: true,
          nextRunAt: '2026-09-10T02:00:00Z',
        };
        state.idempotentSubmissions.set(idempotencyKey, { body: postData, response: scheduleResp });
        state.createdSchedules.push({
          body: postData,
          idempotencyKey,
          timestamp: new Date().toISOString(),
        });
        await fulfillBaseResponse<BacktestCreateResponseDto>(
          route,
          url.pathname,
          scheduleResp,
          201,
        );
        return;
      }

      // RUN_NOW
      const newRunId = `job-run-${Date.now().toString(36)}`;
      const newRunEntry: QuantBacktestRunSummaryDto = {
        runId: newRunId,
        jobConfigCode: `quant-backtest-run-${Date.now().toString(36)}`,
        name: (body?.['name'] as string) || 'Ad-hoc Backtest',
        strategyId: (body?.['strategyId'] as string) || 'ict_liquidity_reversal',
        strategyConfigId:
          (body?.['strategyConfigId'] as string) || 'ict-liquidity-reversal-default-v1',
        datasetVersion: (body?.['datasetVersion'] as string) || 'binance-usdm-1m-202601-v1',
        instrumentIds: (body?.['instrumentIds'] as string[]) || ['BTCUSDT-PERP'],
        status: 'RUNNING',
        jobStatus: 'RUNNING',
        quantOutcome: 'IN_PROGRESS',
        quantStatus: 'RUNNING',
        startedAt: new Date().toISOString(),
        triggerType: 'MANUAL',
      };
      state.runs.unshift(newRunEntry);

      const runNowResp: BacktestCreateResponseDto = {
        executionMode: 'RUN_NOW',
        jobConfigCode: newRunEntry.jobConfigCode,
        jobRunId: newRunId,
        status: 'STARTED',
      };
      state.idempotentSubmissions.set(idempotencyKey, { body: postData, response: runNowResp });
      state.createdRuns.push({
        body: postData,
        idempotencyKey,
        timestamp: new Date().toISOString(),
      });

      await fulfillBaseResponse<BacktestCreateResponseDto>(route, url.pathname, runNowResp, 201);
      return;
    }

    // GET /v1/quant-backtest/runs (List Runs)
    if (method === 'GET' && url.pathname.endsWith('/runs')) {
      const pageParam = parseInt(url.searchParams.get('page') || '0', 10);
      const sizeParam = parseInt(
        url.searchParams.get('size') || url.searchParams.get('pageSize') || '10',
        10,
      );
      const statusFilter = url.searchParams.get('status') || url.searchParams.get('jobStatus');
      const keyword = (url.searchParams.get('keyword') || '').toLowerCase();
      const dateFrom = url.searchParams.get('dateFrom');
      const dateTo = url.searchParams.get('dateTo');

      let filtered = [...state.runs];
      if (statusFilter) {
        filtered = filtered.filter((r) => r['jobStatus'] === statusFilter);
      }
      if (keyword) {
        filtered = filtered.filter((r) =>
          (String(r['name']) + String(r['runId'])).toLowerCase().includes(keyword),
        );
      }
      if (dateFrom) {
        const fromTime = new Date(dateFrom).getTime();
        if (!isNaN(fromTime)) {
          filtered = filtered.filter((r) => new Date(r.startedAt).getTime() >= fromTime);
        }
      }
      if (dateTo) {
        const toTime = new Date(dateTo).getTime();
        if (!isNaN(toTime)) {
          filtered = filtered.filter((r) => new Date(r.startedAt).getTime() <= toTime);
        }
      }

      const start = pageParam * sizeParam;
      const sliced = filtered.slice(start, start + sizeParam);

      await fulfillBaseResponse<QuantRunsPageResponseDto>(route, url.pathname, {
        data: sliced,
        overview: mockSummaryMetrics,
        metadata: {
          totalElements: filtered.length,
          totalPages: Math.ceil(filtered.length / sizeParam) || 1,
          pageNumber: pageParam,
          pageSize: sizeParam,
        },
      });
      return;
    }

    // Catch-all
    await fulfillBaseError(
      route,
      url.pathname,
      'NOT_FOUND',
      `Unhandled ${method} ${url.pathname}`,
      404,
    );
  });

  return state;
}

export async function fulfillBaseResponse<T>(
  route: Route,
  path: string,
  data: T,
  status = 200,
  errorMessage: string | null = null,
  traceId = 'trace-mock-id',
): Promise<void> {
  const body: QuantBaseResponseDto<T> = {
    traceId,
    path,
    status,
    errorMessage,
    data,
  };
  await route.fulfill({
    status,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization,idempotency-key',
      'content-type': 'application/json',
    },
    body: status === 204 ? '' : JSON.stringify(body),
  });
}

export async function fulfillBaseError(
  route: Route,
  path: string,
  code: string,
  message: string,
  status = 400,
  fieldErrors?: Array<{ field: string; message: string }>,
  correlationId = 'trace-mock-err',
): Promise<void> {
  const body: QuantBaseResponseDto<QuantBffErrorEnvelope> = {
    traceId: correlationId,
    path,
    status,
    errorMessage: message,
    data: {
      code,
      message,
      correlationId,
      fieldErrors,
    },
  };
  await route.fulfill({
    status,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization,idempotency-key',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function fulfillJson(route: Route, payload: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization,idempotency-key',
      'content-type': 'application/json',
    },
    body: status === 204 ? '' : JSON.stringify(payload),
  });
}
