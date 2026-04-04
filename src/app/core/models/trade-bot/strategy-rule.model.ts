export type StrategyRuleStatus = 'ACTIVE' | 'INACTIVE' | 'DELETE';

export interface StrategyRuleResponse {
  id: string;
  code: string;
  name: string;
  strategyId: string;
  strategyServiceName: string;
  strategyName: string;
  configJson: Record<string, unknown>;
  description?: string;
  status: StrategyRuleStatus;
}

export interface StrategyRuleCreateDto {
  code: string;
  name: string;
  strategyId: string;
  configJson: Record<string, unknown>;
  description?: string;
  status: StrategyRuleStatus;
}

export interface StrategyRuleUpdateDto extends StrategyRuleCreateDto {}
