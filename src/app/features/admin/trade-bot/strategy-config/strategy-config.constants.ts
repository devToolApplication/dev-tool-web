import { StrategyCreateDto } from '../../../../core/models/trade-bot/reference-data.model';

export const STRATEGY_CONFIG_ROUTES = {
  list: '/admin/trade-bot/strategy-configs',
  create: '/admin/trade-bot/strategy-configs/create',
  edit: (id: string) => `/admin/trade-bot/strategy-configs/${id}/edit`
};

export const STRATEGY_CONFIG_INITIAL_VALUE: StrategyCreateDto = {
  serviceName: '',
  name: '',
  description: '',
  version: '1.0.0',
  status: 'ACTIVE'
};
