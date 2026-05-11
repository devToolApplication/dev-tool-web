import { AuditLevel, SameBarExitPolicy, TradeSide } from './trading-system.types';

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
  source?: string;
  closed?: boolean;
}

export interface CandleBarDto extends Omit<CandleBarResponse, 'id'> {}

export interface CandleBulkImportDto {
  candles: CandleBarDto[];
}

export interface ExecutorVersionResponse {
  executor: string;
  latestVersion: string;
  versions: string[];
}

export interface IndicatorConfigResponse {
  id: string;
  code: string;
  executor: string;
  executorVersion: string;
  displayType?: string;
  config: Record<string, unknown>;
  children: Array<Record<string, unknown>>;
  overlay: Record<string, unknown>;
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
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  summary?: Record<string, unknown>;
  failureReason?: string;
  startedAt?: string;
  completedAt?: string;
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

export interface OverlayRequestDto {
  symbol: string;
  timeframe: string;
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
