export type StrategyRoutePath =
  | 'first-m15-new-york'
  | 'ema-pullback-trend'
  | 'opening-range-breakout'
  | 'prev-day-high-low-retest'
  | 'donchian-breakout-20'
  | 'bollinger-rsi-mean-reversion'
  | 'vwap-pullback-intraday'
  | 'asia-range-london-breakout'
  | 'inside-bar-breakout-mtf'
  | 'rsi-divergence-swing'
  | 'liquidity-sweep-fvg-reclaim';

export type StrategyUiFamily = 'breakout' | 'trend' | 'mean-reversion' | 'session' | 'pattern' | 'divergence' | 'liquidity';

export interface StrategyUiMetadata {
  code: string;
  routePath: StrategyRoutePath;
  icon: string;
  displayOrder: number;
  family: StrategyUiFamily;
  accentColor: string;
  shortDescription: string;
}

export interface StrategyTypePickerItem {
  code: string;
  name: string;
  description?: string;
  routePath: StrategyRoutePath;
  icon: string;
  displayOrder: number;
  family: StrategyUiFamily;
  accentColor: string;
}
