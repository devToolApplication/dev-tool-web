export type StrategyRoutePath =
  | 'first-m15-new-york'
  | 'ema-pullback-trend'
  | 'opening-range-breakout'
  | 'prev-day-high-low-retest'
  | 'donchian-breakout-20'
  | 'bollinger-rsi-mean-reversion'
  | 'bollinger-rsi-support-resistance'
  | 'vwap-pullback-intraday'
  | 'asia-range-london-breakout'
  | 'inside-bar-breakout-mtf'
  | 'rsi-divergence-swing'
  | 'liquidity-sweep-fvg-reclaim'
  | 'pivot-sweep-rejection';

export type StrategyUiFamily = 'breakout' | 'trend' | 'mean-reversion' | 'session' | 'pattern' | 'divergence' | 'liquidity' | 'price-action';

export interface StrategyUiMetadata {
  serviceName: string;
  routePath: StrategyRoutePath;
  icon: string;
  displayOrder: number;
  family: StrategyUiFamily;
  accentColor: string;
  shortDescription: string;
}

export interface StrategyTypePickerItem {
  serviceName: string;
  name: string;
  description?: string;
  routePath: StrategyRoutePath;
  icon: string;
  displayOrder: number;
  family: StrategyUiFamily;
  accentColor: string;
}
