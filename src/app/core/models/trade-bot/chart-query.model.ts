export interface TradeBotCandlestickData {
  utcTimeStamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradeBotLineData {
  name?: string;
  color?: string;
  from?: {
    time: number;
    value: number;
  };
  to?: {
    time: number;
    value: number;
  };
}

export interface TradeBotAreaData {
  name?: string;
  color?: string;
  from?: number;
  to?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface TradeBotPointData {
  name?: string;
  color?: string;
  shape?: string;
  time: number;
  value: number;
}

export interface TradeBotIndicatorData {
  name?: string;
  color?: string;
  type?: 'OVERLAY' | 'SUBCHART';
  value: Array<number | null>;
  defaultDisplay?: boolean;
}

export interface TradeBotCandleResponse {
  candlestickData: TradeBotCandlestickData[];
}

export interface TradeBotOverlayResponse {
  lineData: TradeBotLineData[];
  areaData: TradeBotAreaData[];
  pointData: TradeBotPointData[];
  indicatorData: TradeBotIndicatorData[];
}

export type TradeBotChartResponse = TradeBotCandleResponse & Partial<TradeBotOverlayResponse>;

export interface TradeSignalStreamRequest {
  requestId: string;
  dataResource: string;
  symbol: string;
  interval: string;
  startTime: number;
  endTime: number;
  resultStartTime?: number;
  ruleCode?: string;
  strategyServiceName?: string;
  showAreaLabels?: boolean;
  configJson: Record<string, unknown>;
}

export interface TradeSignalStreamResponse {
  requestId?: string;
  data?: TradeBotOverlayResponse;
  errorMessage?: string;
}
