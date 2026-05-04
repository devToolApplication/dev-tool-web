import { StrategyUiMetadata } from '../../../../../core/models/trade-bot/strategy-ui.model';

export const STRATEGY_UI_REGISTRY: StrategyUiMetadata[] = [
  {
    serviceName: 'FVG_TOUCH_RETEST',
    routePath: 'fvg-touch-retest',
    icon: 'pi pi-bolt',
    displayOrder: 10,
    family: 'liquidity',
    accentColor: 'var(--app-chart-success)',
    shortDescription: 'Trade bullish and bearish FVG touch retests'
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
