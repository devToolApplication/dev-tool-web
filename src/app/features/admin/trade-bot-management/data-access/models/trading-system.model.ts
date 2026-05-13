import { AuditLevel, SameBarExitPolicy, TradeSide } from './trading-system.types';
import { FormConfig } from '../../../../../shared/ui/form-input/models/form-config.model';

export interface CandleBarResponse {
  id?: string;
  symbol: string;
  timeframe: string;
  openTime: string;
  closeTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  quoteVolume?: number;
  tradeCount?: number;
  takerBuyBaseVolume?: number;
  takerBuyQuoteVolume?: number;
  source?: string;
  marketType?: string;
  feedCode?: string;
  closed?: boolean;
  candleHash?: string;
  dataVersion?: number;
  raw?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CandleBarDto extends Omit<CandleBarResponse, 'id'> {}

export interface CandleBulkImportDto {
  candles: CandleBarDto[];
}

export interface BinanceUsdmCandleSyncDto {
  symbols: string[];
  timeframes: string[];
  fromTime?: string;
  toTime?: string;
  initialLookbackHours?: number;
  limit?: number;
  maxPages?: number;
  lookbackBars?: number;
  includeOpenCandle?: boolean;
  onlyClosedCandle?: boolean;
  triggerType?: string;
  requestedBy?: string;
}

export interface BinanceUsdmCandleSyncResponse {
  runId: string;
  source: string;
  marketType?: string;
  status: string;
  progressTopic?: string;
  fetched: number;
  upserted: number;
  skipped: number;
  failed: number;
  invalid: number;
  gapsDetected: number;
  durationMs?: number;
  results: BinanceUsdmCandleSyncItemResponse[];
}

export interface BinanceUsdmCandleSyncItemResponse {
  runId: string;
  symbol: string;
  timeframe: string;
  source: string;
  marketType?: string;
  feedCode?: string;
  status: string;
  fromTime?: string;
  toTime?: string;
  lastSyncedOpenTime?: string;
  lastSyncedCloseTime?: string;
  fetched: number;
  upserted: number;
  skipped: number;
  inserted: number;
  updated: number;
  duplicates: number;
  invalid: number;
  skippedOpenCandles: number;
  gapsDetected: number;
  errorMessage?: string;
}

export interface CandleSyncRunResponse {
  id: string;
  runId: string;
  source: string;
  marketType?: string;
  feedCode?: string;
  symbol: string;
  timeframe: string;
  triggerType?: string;
  mode?: string;
  fromTime?: string;
  toTime?: string;
  status: string;
  fetched?: number;
  inserted?: number;
  updated?: number;
  duplicates?: number;
  invalid?: number;
  skippedOpenCandles?: number;
  gapsDetected?: number;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  errorMessage?: string;
}

export interface CandleGapResponse {
  id: string;
  source: string;
  marketType?: string;
  feedCode?: string;
  symbol: string;
  timeframe: string;
  expectedOpenTime: string;
  nextAvailableOpenTime?: string;
  missingBars?: number;
  status: string;
  detectedRunId?: string;
  repairedRunId?: string;
  createdAt?: string;
  repairedAt?: string;
}

export interface ExecutorVersionResponse {
  executor: string;
  latestVersion: string;
  versions: string[];
  usesConfig?: boolean;
  childSlots?: IndicatorChildSlotResponse[];
}

export interface IndicatorChildSlotResponse {
  slotCode: string;
  labelKey?: string;
  required?: boolean;
  acceptedExecutors?: string[];
  multiple?: boolean;
}

export interface IndicatorChildConfig {
  slotCode: string;
  indicatorCode: string;
  config?: Record<string, unknown>;
}

export interface IndicatorConfigResponse {
  id: string;
  code: string;
  executor: string;
  executorVersion: string;
  displayType?: string;
  config: Record<string, unknown>;
  children: IndicatorChildConfig[];
  overlay: Record<string, unknown>;
  formTemplate?: FormConfig;
  status?: string;
}

export interface IndicatorConfigDto extends Omit<IndicatorConfigResponse, 'id'> {}

export interface RuleConfigResponse {
  id: string;
  code: string;
  executor: string;
  executorVersion: string;
  config: Record<string, unknown>;
  indicators: string[];
  childRules: Array<Record<string, unknown>>;
  overlay: Record<string, unknown>;
  formTemplate?: FormConfig;
  status?: string;
}

export interface RuleConfigDto extends Omit<RuleConfigResponse, 'id'> {}

export interface StrategyConfigResponse {
  id: string;
  code: string;
  type: 'ENTRY_TP_SL';
  strategyVersion: string;
  config: Record<string, unknown>;
  entryRule: string;
  slRule: string;
  tpRule: string;
  status?: string;
}

export interface StrategyConfigDto extends Omit<StrategyConfigResponse, 'id'> {}

export interface BacktestRunDto {
  runId?: string;
  strategyCode: string;
  symbol: string;
  timeframe: string;
  source?: string;
  marketType?: string;
  feedCode?: string;
  fromTime: string;
  toTime: string;
  startIndex?: number;
  endIndex?: number;
  initialBalance: number;
  riskPerTradePct: number;
  feeRate: number;
  slippageRate: number;
  sameBarExitPolicy: SameBarExitPolicy;
  auditLevel: AuditLevel;
  saveFailedEntrySummary: boolean;
}

export interface BacktestRunResponse extends BacktestRunDto {
  id: string;
  currentBalance: number;
  barSeriesId?: string;
  configSnapshotId?: string;
  marketDataSnapshotId?: string;
  candleRangeHash?: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  summary?: Record<string, unknown>;
  failureReason?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface BacktestStartResponse {
  runId: string;
  status: string;
  progressTopic: string;
  message: string;
}

export interface BacktestTradeResponse {
  id: string;
  runId: string;
  tradeId: string;
  symbol: string;
  timeframe: string;
  side: TradeSide;
  entryIndex: number;
  exitIndex?: number;
  entryTime?: string;
  exitTime?: string;
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  quantity: number;
  riskAmount: number;
  fee?: number;
  pnl?: number;
  pnlPct?: number;
  exitReason?: string;
  ruleTraceId?: string;
}

export interface BacktestCurvePointResponse {
  barIndex: number;
  time: string;
  balance?: number;
  equity?: number;
  drawdown?: number;
  drawdownPct?: number;
}

export interface BacktestMetricResponse {
  runId: string;
  metrics: Record<string, unknown>;
}

export interface BacktestEventResponse {
  id: string;
  runId: string;
  barIndex: number;
  eventTime: string;
  type: string;
  message: string;
  data: Record<string, unknown>;
}

export interface BacktestRuleTraceResponse {
  id: string;
  runId: string;
  tradeId: string;
  barIndex: number;
  evaluatedAt: string;
  trace: Record<string, unknown>;
}

export interface BacktestOrderResponse extends Record<string, unknown> {
  id?: string;
  runId?: string;
  orderId?: string;
  tradeId?: string;
  side?: TradeSide | string;
  type?: string;
  status?: string;
  price?: number;
  quantity?: number;
  fee?: number;
  barIndex?: number;
  orderTime?: string;
}

export interface BacktestPositionResponse extends Record<string, unknown> {
  id?: string;
  runId?: string;
  positionId?: string;
  tradeId?: string;
  side?: TradeSide | string;
  status?: string;
  entryPrice?: number;
  exitPrice?: number;
  quantity?: number;
  pnl?: number;
}

export interface BacktestReviewSummaryResponse {
  run?: BacktestRunResponse | Record<string, unknown>;
  metrics?: BacktestMetricResponse | Record<string, unknown>;
  snapshot?: Record<string, unknown>;
}

export interface BacktestReviewResponse {
  summary?: BacktestReviewSummaryResponse;
  trades?: BacktestTradeResponse[];
  orders?: BacktestOrderResponse[];
  positions?: BacktestPositionResponse[];
  equity?: BacktestCurvePointResponse[];
  drawdown?: BacktestCurvePointResponse[];
  events?: BacktestEventResponse[];
  overlays?: Record<string, unknown>[];
}

export interface BacktestChartReviewResponse {
  candles?: CandleBarResponse[];
  candleRangeHash?: string;
  trades?: BacktestTradeResponse[];
  overlays?: Record<string, unknown>[];
}

export interface FastBacktestRequest {
  strategyCode: string;
  symbol: string;
  timeframe: string;
  source?: string;
  marketType?: string;
  feedCode?: string;
  fromTime: string;
  toTime: string;
  startIndex?: number;
  endIndex?: number;
  warmupBars?: number;
  initialCapital?: number;
  riskPerTradePct?: number;
  feeRate?: number;
  slippageRate?: number;
  params?: Record<string, unknown>;
}

export interface FastBacktestResponse {
  requestId: string;
  candleRangeHash: string;
  result: Record<string, unknown>;
}

export interface EvaluateBarRequest {
  strategyCode: string;
  symbol: string;
  timeframe: string;
  source?: string;
  marketType?: string;
  feedCode?: string;
  fromTime: string;
  toTime: string;
  index: number;
  params?: Record<string, unknown>;
}

export interface EvaluateBarResponse {
  candleRangeHash: string;
  index: number;
  signal: Record<string, unknown>;
  trace: Record<string, unknown>;
  candle?: CandleBarResponse | Record<string, unknown>;
  finalSignal?: Record<string, unknown>;
  ruleTrace?: Record<string, unknown>;
  indicatorValues?: Record<string, unknown>;
}

export interface OverlayRequestDto {
  symbol: string;
  timeframe: string;
  source?: string;
  marketType?: string;
  feedCode?: string;
  fromTime: string;
  toTime: string;
  overlayCodes: string[];
}

export interface OverlayResponse {
  candles: CandleBarResponse[];
  overlays: Record<string, unknown>;
}

export interface ReplayInitDto extends OverlayRequestDto {
  strategyCode: string;
}

export interface ReplayInitResponse {
  sessionId?: string;
  replayTopic?: string;
  strategyCode: string;
  symbol: string;
  timeframe: string;
  currentIndex: number;
  candles: CandleBarResponse[];
  overlay: OverlayResponse;
}

export interface EvaluateIndexDto {
  index: number;
}

export interface CacheMonitorResponse {
  generatedAt?: string;
  cacheNames?: string[];
  local?: Record<string, unknown>;
  redis?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
}

export interface CacheEvictRequest {
  cacheName?: string;
  key?: string;
  prefix?: string;
  allLocal?: boolean;
}

export interface SystemLogResponse extends Record<string, unknown> {
  time?: string;
  module?: string;
  level?: string;
  status?: string;
  runId?: string;
  message?: string;
  symbol?: string;
  timeframe?: string;
}

export interface BacktestReportExportResponse {
  runId: string;
  format: string;
  generatedAt?: string;
  report: Record<string, unknown>;
  chart?: Record<string, unknown>;
}

export interface ConfigVersionHistoryResponse {
  configType: 'INDICATOR' | 'RULE' | 'STRATEGY' | string;
  id: string;
  versions: Array<Record<string, unknown>>;
}
