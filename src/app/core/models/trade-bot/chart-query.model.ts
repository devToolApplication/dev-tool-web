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
  lineData: TradeBotLineData[];
  areaData: TradeBotAreaData[];
  pointData: TradeBotPointData[];
  indicatorData: TradeBotIndicatorData[];
}
