import { StrategyUiMetadata } from '../../../../../core/models/trade-bot/strategy-ui.model';

export const STRATEGY_UI_REGISTRY: StrategyUiMetadata[] = [
  {
    code: 'FIRST_M15_NEWYORK',
    routePath: 'first-m15-new-york',
    icon: 'pi pi-clock',
    displayOrder: 10,
    family: 'session',
    accentColor: '#0f766e',
    shortDescription: 'tradeBot.strategy.meta.firstM15.description'
  },
  {
    code: 'EMA_PULLBACK_TREND',
    routePath: 'ema-pullback-trend',
    icon: 'pi pi-arrow-up-right',
    displayOrder: 20,
    family: 'trend',
    accentColor: '#2563eb',
    shortDescription: 'tradeBot.strategy.meta.emaPullback.description'
  },
  {
    code: 'OPENING_RANGE_BREAKOUT',
    routePath: 'opening-range-breakout',
    icon: 'pi pi-chart-line',
    displayOrder: 30,
    family: 'breakout',
    accentColor: '#7c3aed',
    shortDescription: 'tradeBot.strategy.meta.openingRange.description'
  },
  {
    code: 'PREV_DAY_HIGH_LOW_RETEST',
    routePath: 'prev-day-high-low-retest',
    icon: 'pi pi-flag',
    displayOrder: 40,
    family: 'breakout',
    accentColor: '#0d9488',
    shortDescription: 'tradeBot.strategy.meta.prevDay.description'
  },
  {
    code: 'DONCHIAN_BREAKOUT_20',
    routePath: 'donchian-breakout-20',
    icon: 'pi pi-chart-bar',
    displayOrder: 50,
    family: 'trend',
    accentColor: '#1d4ed8',
    shortDescription: 'tradeBot.strategy.meta.donchian.description'
  },
  {
    code: 'BOLLINGER_RSI_MEAN_REVERSION',
    routePath: 'bollinger-rsi-mean-reversion',
    icon: 'pi pi-sync',
    displayOrder: 60,
    family: 'mean-reversion',
    accentColor: '#dc2626',
    shortDescription: 'tradeBot.strategy.meta.bollingerRsi.description'
  },
  {
    code: 'VWAP_PULLBACK_INTRADAY',
    routePath: 'vwap-pullback-intraday',
    icon: 'pi pi-wave-pulse',
    displayOrder: 70,
    family: 'mean-reversion',
    accentColor: '#ea580c',
    shortDescription: 'tradeBot.strategy.meta.vwapPullback.description'
  },
  {
    code: 'ASIA_RANGE_LONDON_BREAKOUT',
    routePath: 'asia-range-london-breakout',
    icon: 'pi pi-globe',
    displayOrder: 80,
    family: 'session',
    accentColor: '#0891b2',
    shortDescription: 'tradeBot.strategy.meta.asiaLondon.description'
  },
  {
    code: 'INSIDE_BAR_BREAKOUT_MTF',
    routePath: 'inside-bar-breakout-mtf',
    icon: 'pi pi-stop',
    displayOrder: 90,
    family: 'pattern',
    accentColor: '#4f46e5',
    shortDescription: 'tradeBot.strategy.meta.insideBar.description'
  },
  {
    code: 'RSI_DIVERGENCE_SWING',
    routePath: 'rsi-divergence-swing',
    icon: 'pi pi-sliders-h',
    displayOrder: 100,
    family: 'divergence',
    accentColor: '#be185d',
    shortDescription: 'tradeBot.strategy.meta.rsiDivergence.description'
  },
  {
    code: 'LIQUIDITY_SWEEP_FVG_RECLAIM',
    routePath: 'liquidity-sweep-fvg-reclaim',
    icon: 'pi pi-bolt',
    displayOrder: 110,
    family: 'liquidity',
    accentColor: '#9333ea',
    shortDescription: 'tradeBot.strategy.meta.liquidityFvg.description'
  }
];

export function resolveStrategyUiMetadataByCode(code: string | null | undefined): StrategyUiMetadata | undefined {
  if (!code) {
    return undefined;
  }
  return STRATEGY_UI_REGISTRY.find((item) => item.code === code);
}

export function resolveStrategyUiMetadataByRoutePath(routePath: string | null | undefined): StrategyUiMetadata | undefined {
  if (!routePath) {
    return undefined;
  }
  return STRATEGY_UI_REGISTRY.find((item) => item.routePath === routePath);
}
