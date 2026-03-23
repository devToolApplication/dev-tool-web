import { TradeBotConfigCreateDto } from '../../../../../core/models/trade-bot/config.model';

export const TRADE_BOT_CONFIG_ROUTES = {
  list: '/admin/system-management/trade-bot-configs',
  create: '/admin/system-management/trade-bot-configs/create'
} as const;

export const TRADE_BOT_CONFIG_INITIAL_VALUE: TradeBotConfigCreateDto = {
  category: '',
  key: '',
  value: '{}',
  description: '',
  status: 'ACTIVE'
};
