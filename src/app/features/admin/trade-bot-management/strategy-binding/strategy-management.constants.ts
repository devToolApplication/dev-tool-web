export const STRATEGY_MANAGEMENT_ROUTES = {
  list: '/admin/trade-bot/strategy-binding',
  createEntry: '/admin/trade-bot/strategy-binding/create',
  createByPath: (routePath: string) => `/admin/trade-bot/strategy-binding/create/${routePath}`,
  edit: (id: string) => `/admin/trade-bot/strategy-binding/${id}/edit`,
  backtest: (id: string) => `/admin/trade-bot/strategy-binding/${id}/backtest`
};

export const STRATEGY_FAMILY_LABELS: Record<string, string> = {
  breakout: 'tradeBot.strategy.family.breakout',
  trend: 'tradeBot.strategy.family.trend',
  'mean-reversion': 'tradeBot.strategy.family.meanReversion',
  session: 'tradeBot.strategy.family.session',
  pattern: 'tradeBot.strategy.family.pattern',
  divergence: 'tradeBot.strategy.family.divergence',
  liquidity: 'tradeBot.strategy.family.liquidity',
  'price-action': 'Price Action'
};
