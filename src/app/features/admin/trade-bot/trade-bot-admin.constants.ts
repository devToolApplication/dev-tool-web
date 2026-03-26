import { TradeStrategyBindingCreateDto, TradeSideMode } from '../../../core/models/trade-bot/trade-strategy-binding.model';
import { TradeBotTextKey } from './strategies/shared/strategy-ui.enums';

export const TRADE_BOT_BINDING_ROUTES = {
  list: '/admin/trade-bot/strategies',
  create: '/admin/trade-bot/strategies/create'
};

export const TRADE_BOT_BACKTEST_ROUTES = {
  list: '/admin/trade-bot/backtests',
  run: '/admin/trade-bot/backtests/run'
};

export const TRADE_SIDE_MODE_OPTIONS = [
  { label: TradeBotTextKey.OptionTradeSideBoth, value: 'BOTH' },
  { label: TradeBotTextKey.OptionTradeSideLongOnly, value: 'LONG_ONLY' },
  { label: TradeBotTextKey.OptionTradeSideShortOnly, value: 'SHORT_ONLY' }
];

export const MARKET_TYPE_OPTIONS = [
  { label: TradeBotTextKey.OptionMarketTypeCrypto, value: 'CRYPTO' },
  { label: TradeBotTextKey.OptionMarketTypeForex, value: 'FOREX' },
  { label: TradeBotTextKey.OptionMarketTypeMetal, value: 'METAL' }
];

export const STRATEGY_CONFIG_DEFAULTS = {
  timezone: 'America/New_York',
  firstM15CandleStart: '09:30',
  baseTimeframe: 'M15',
  triggerTimeframe: 'M5',
  breakoutConfirmByClose: true,
  entryMode: 'NEXT_CANDLE_OPEN',
  slMode: 'FIRST_CANDLE_MID_RANGE',
  tpRr: 2,
  maxTradesPerDay: 1,
  strategyValidity: 'SAME_NEW_YORK_DAY'
};

export const TRADE_STRATEGY_BINDING_INITIAL_VALUE = {
  name: '',
  exchangeCode: 'OANDA',
  symbolCode: 'XAUUSD',
  strategyCode: 'FIRST_M15_NEWYORK',
  marketType: 'FOREX',
  tradeSideMode: 'BOTH' as TradeSideMode,
  providerSymbol: 'XAU_USD',
  description: '',
  status: 'ACTIVE' as const,
  ...STRATEGY_CONFIG_DEFAULTS
};
