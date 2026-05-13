import type { Time } from 'lightweight-charts';
import type { Observable } from 'rxjs';

export type CandleChartTime = string | number | Time;
export type CandleChartRange = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'ALL';
export type CandleChartMode = 'HISTORICAL' | 'REPLAY' | 'REALTIME';
export type CandleChartStatus =
  | 'IDLE'
  | 'LOADING'
  | 'READY'
  | 'PLAYING'
  | 'PAUSED'
  | 'ENDED'
  | 'ERROR';
export type CandleChartTheme = 'LIGHT' | 'DARK' | 'AUTO';
export type CandleChartOverlayType =
  | 'MARKER'
  | 'PRICE_LINE'
  | 'TREND_LINE'
  | 'BOX'
  | 'POLYLINE'
  | 'LABEL';
export type CandleChartOverlaySource = 'INDICATOR' | 'RULE' | 'STRATEGY' | 'PAPER_TRADE' | 'USER_DRAWING';
export type CandleChartIndicatorPane = 'MAIN' | 'SUB' | 'overlay' | 'subchart';
export type CandleChartIndicatorType = 'LINE' | 'HISTOGRAM' | 'AREA';

export interface CandleData {
  time: CandleChartTime;
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
}

export interface ChartCandle extends CandleData {
  index?: number;
  openTime?: CandleChartTime;
  closeTime?: CandleChartTime;
  closed?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ChartLine {
  name: string;
  color: string;
  start: number;
  end: number;
  startTime: CandleChartTime;
  endTime: CandleChartTime;
}

export interface ChartBoxArea {
  name?: string;
  color: string;
  startTime: CandleChartTime;
  endTime: CandleChartTime;
  high: number;
  low: number;
}

export interface ChartPoint {
  name: string;
  color: string;
  shape?: string;
  startTime: CandleChartTime;
  price: number;
  size?: number;
}

export interface ChartIndicatorSeries {
  name: string;
  color: string;
  pane: 'overlay' | 'subchart';
  values: Array<number | null>;
}

export interface ChartIndicator {
  code?: string;
  name: string;
  pane: CandleChartIndicatorPane;
  type?: CandleChartIndicatorType;
  visible?: boolean;
  color?: string;
  priceScaleId?: string;
  values: Array<number | null>;
}

export interface ChartOverlayPoint {
  time?: CandleChartTime;
  index?: number;
  price?: number;
  value?: number;
}

export interface ChartOverlay {
  id?: string;
  type: CandleChartOverlayType;
  source?: CandleChartOverlaySource;
  sourceCode?: string;
  index?: number;
  time?: CandleChartTime;
  price?: number;
  start?: number;
  end?: number;
  startPrice?: number;
  endPrice?: number;
  startIndex?: number;
  endIndex?: number;
  startTime?: CandleChartTime;
  endTime?: CandleChartTime;
  low?: number;
  high?: number;
  points?: ChartOverlayPoint[];
  text?: string;
  color?: string;
  shape?: string;
  size?: number;
  visible?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CandleChartPayload {
  candles: CandleData[];
  lines: ChartLine[];
  boxAreas: ChartBoxArea[];
  points: ChartPoint[];
  indicators: ChartIndicatorSeries[];
}

export interface CandleChartConfig {
  showCandles?: boolean;
  showVolume?: boolean;
  showLines?: boolean;
  showBoxAreas?: boolean;
  showPoints?: boolean;
  showIndicators?: boolean;
  showRules?: boolean;
  showStrategySignals?: boolean;
  showOverlayLabels?: boolean;
  showHeader?: boolean;
  showToolbar?: boolean;
  showReplayControls?: boolean;
  showDebugPanel?: boolean;
  showAttribution?: boolean;
  showLastPriceLine?: boolean;
  showPriceAxisLabels?: boolean;
  showPreviewBar?: boolean;
  autoScrollToRealtime?: boolean;
  evaluateOnBarChange?: boolean;
  evaluateOnClosedCandleOnly?: boolean;
  evaluateLivePreview?: boolean;
  symbol?: string;
  exchange?: string;
  interval?: string;
  timeframe?: string;
  height?: number;
  watermark?: string;
  theme?: CandleChartTheme;
  mode?: CandleChartMode;
}

export interface ResolvedCandleChartConfig extends CandleChartConfig {
  showCandles: boolean;
  showVolume: boolean;
  showLines: boolean;
  showBoxAreas: boolean;
  showPoints: boolean;
  showIndicators: boolean;
  showRules: boolean;
  showStrategySignals: boolean;
  showOverlayLabels: boolean;
  showHeader: boolean;
  showToolbar: boolean;
  showReplayControls: boolean;
  showDebugPanel: boolean;
  showAttribution: boolean;
  showLastPriceLine: boolean;
  showPriceAxisLabels: boolean;
  showPreviewBar: boolean;
  autoScrollToRealtime: boolean;
  evaluateOnBarChange: boolean;
  evaluateOnClosedCandleOnly: boolean;
  evaluateLivePreview: boolean;
  height: number;
  theme: CandleChartTheme;
}

export interface ReplayConfig {
  initialIndex?: number;
  speedMs?: number;
  autoPlay?: boolean;
  loop?: boolean;
  stopAtSignal?: boolean;
}

export interface RealtimeConfig {
  enabled?: boolean;
  streamUrl?: string;
  reconnect?: boolean;
  reconnectIntervalMs?: number;
  heartbeatMs?: number;
}

export interface EvaluationConfig {
  enabled?: boolean;
  strategyCode?: string;
  runId?: string;
  executorVersion?: string;
  includeIndicators?: boolean;
  includeRules?: boolean;
  includeStrategy?: boolean;
  includeTrace?: boolean;
  cacheEnabled?: boolean;
  debounceMs?: number;
}

export interface CandleChartBarChangedEvent {
  index: number;
  candle: ChartCandle;
  mode: CandleChartMode;
  status: CandleChartStatus;
}

export interface CandleChartReplayStatusEvent {
  index: number;
  status: CandleChartStatus;
  speedMs: number;
}

export interface CandleChartErrorEvent {
  message: string;
  detail?: unknown;
}

export interface CandleChartStrategySignal {
  entry?: boolean;
  side?: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  entryRuleResult?: Record<string, unknown>;
  detail?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CandleChartRuleEvaluation {
  satisfied?: boolean;
  executor?: string;
  version?: string;
  message?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  children?: CandleChartRuleEvaluation[];
  [key: string]: unknown;
}

export interface CandleChartEvaluationResult {
  rule?: CandleChartRuleEvaluation | Record<string, unknown>;
  trace?: CandleChartRuleEvaluation | Record<string, unknown>;
  strategy?: CandleChartStrategySignal | Record<string, unknown>;
  overlays?: ChartOverlay[];
  message?: string;
  [key: string]: unknown;
}

export type CandleChartEvaluateHandler = (
  event: CandleChartBarChangedEvent,
) =>
  | CandleChartEvaluationResult
  | null
  | undefined
  | Promise<CandleChartEvaluationResult | null | undefined>
  | Observable<CandleChartEvaluationResult | null | undefined>;

export interface CandleChartRealtimeMessage {
  type: 'CANDLE' | 'OVERLAY' | 'RESET' | 'ERROR';
  candle?: ChartCandle;
  candles?: ChartCandle[];
  overlay?: ChartOverlay;
  overlays?: ChartOverlay[];
  message?: string;
  data?: unknown;
}

export interface RenderedBoxArea {
  key: string;
  name?: string;
  style: Record<string, string>;
}

export interface RenderedLineLabel {
  key: string;
  name: string;
  style: Record<string, string>;
}
