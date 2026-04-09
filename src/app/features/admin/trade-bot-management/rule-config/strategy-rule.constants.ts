import { StrategyRuleCreateDto } from '../../../../core/models/trade-bot/strategy-rule.model';

export const STRATEGY_RULE_ROUTES = {
  list: '/admin/trade-bot/rule-configs',
  create: '/admin/trade-bot/rule-configs/create',
  edit: (id: string) => `/admin/trade-bot/rule-configs/${id}/edit`,
  test: (id: string) => `/admin/trade-bot/rule-configs/${id}/test`
};

export const STRATEGY_RULE_INITIAL_VALUE: StrategyRuleCreateDto = {
  code: '',
  name: '',
  configJson: {},
  description: '',
  status: 'ACTIVE'
};
