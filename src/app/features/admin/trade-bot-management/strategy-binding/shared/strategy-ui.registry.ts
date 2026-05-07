import { StrategyUiMetadata } from '../../../../../core/models/trade-bot/strategy-ui.model';

export const STRATEGY_UI_REGISTRY: StrategyUiMetadata[] = [
  {
    serviceName: 'FVG_TOUCH_RETEST_BUY',
    routePath: 'fvg-touch-retest-buy',
    icon: 'pi pi-bolt',
    displayOrder: 10,
    family: 'liquidity',
    accentColor: 'var(--app-chart-success)',
    shortDescription: 'Trade bullish FVG touch retests with PA support confluence'
  },
  {
    serviceName: 'FVG_TOUCH_RETEST_SELL',
    routePath: 'fvg-touch-retest-sell',
    icon: 'pi pi-bolt',
    displayOrder: 11,
    family: 'liquidity',
    accentColor: 'var(--app-chart-danger)',
    shortDescription: 'Trade bearish FVG touch retests with PA resistance confluence'
  }
];

export function resolveStrategyUiMetadataByServiceName(serviceName: string | null | undefined): StrategyUiMetadata | undefined {
  if (!serviceName) {
    return undefined;
  }
  return STRATEGY_UI_REGISTRY.find((item) => item.serviceName === serviceName);
}

export function resolveStrategyUiMetadataByRoutePath(routePath: string | null | undefined): StrategyUiMetadata | undefined {
  if (!routePath) {
    return undefined;
  }
  return STRATEGY_UI_REGISTRY.find((item) => item.routePath === routePath);
}
