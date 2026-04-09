import { SyncConfigCreateDto } from '../../../core/models/trade-bot/sync-config.model';

export const TRADE_BOT_ROUTES = {
  list: '/admin/trade-bot/data-source',
  create: '/admin/trade-bot/data-source/create'
};

export const TRADE_BOT_INITIAL_VALUE: SyncConfigCreateDto = {
  dataResource: 'BINANCE',
  symbol: 'BTCUSDT',
  intervals: ['h1'],
  status: 'ACTIVE'
};

export const TRADE_BOT_DATA_RESOURCE_OPTIONS = [
  { label: 'Binance', value: 'BINANCE' },
  { label: 'OANDA', value: 'OANDA' }
];

export const TRADE_BOT_SYMBOL_OPTIONS = [
  { label: 'BTCUSDT', value: 'BTCUSDT' },
  { label: 'ETHUSDT', value: 'ETHUSDT' },
  { label: 'EUR_USD', value: 'EUR_USD' },
  { label: 'XAU_USD', value: 'XAU_USD' }
];
