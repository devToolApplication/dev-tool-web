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

export interface BacktestRunsQueryParamsDto {
  page?: number;
  size?: number;
  keyword?: string;
  status?: JobRunStatus;
  strategyId?: string;
  instrument?: string;
  dateFrom?: string;
  dateTo?: string;
  triggerType?: TriggerType;
}

export interface SimulationConfigurationDto {
  intrabarPolicy: string;
  feeModel: string;
  slippageModel: string;
  slippageBps: string;
}

export interface BacktestScheduleConfigDto {
  cron: string;
  timezone?: string;
}

export interface BacktestCreateRequestDto {
  name: string;
  executionMode: ExecutionMode;
  schedule?: BacktestScheduleConfigDto | null;
  description?: string;
  strategyId: string;
  strategyConfigId: string;
  datasetVersion: string;
  instrumentIds: string[];
  start: string;
  end: string;
  initialCapital: string;
  simulationConfiguration: SimulationConfigurationDto;
  parameters?: Record<string, unknown>;
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
  winRate: number;
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

export interface QuantStrategiesResponseDto {
  strategies: QuantStrategyDto[];
}

export interface StrategyValidationRequestDto {
  strategyId: string;
  strategyConfigId?: string;
  parameters: Record<string, unknown>;
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
