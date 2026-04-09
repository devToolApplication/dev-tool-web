import { TradeBotSecretCreateDto } from '../../../../../core/models/trade-bot/trade-bot-secret.model';

export const TRADE_BOT_SECRET_ROUTES = {
  list: '/admin/system-management/trade-bot-secrets',
  create: '/admin/system-management/trade-bot-secrets/create'
} as const;

export const TRADE_BOT_SECRET_INITIAL_VALUE: TradeBotSecretCreateDto = {
  category: '',
  name: '',
  code: '',
  secretValue: '',
  description: '',
  status: 'ACTIVE'
};
