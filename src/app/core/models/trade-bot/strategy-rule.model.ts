export type StrategyRuleStatus = 'ACTIVE' | 'INACTIVE' | 'DELETE';

export interface StrategyRuleResponse {
  id: string;
  code: string;
  name: string;
  ruleGroupCode?: string;
  ruleGroupLabel?: string;
  implementationCode?: string;
  strategyId?: string;
  strategyServiceName?: string;
  strategyName?: string;
  configFields?: Array<Record<string, unknown>>;
  initialValue?: Record<string, unknown>;
  configJson: Record<string, unknown>;
  description?: string;
  status: StrategyRuleStatus;
}

export interface StrategyRuleCreateDto {
  code: string;
  name: string;
  ruleGroupCode?: string;
  ruleGroupLabel?: string;
  implementationCode?: string;
  configFields?: Array<Record<string, unknown>>;
  initialValue?: Record<string, unknown>;
  configJson: Record<string, unknown>;
  description?: string;
  status: StrategyRuleStatus;
}

export interface StrategyRuleUpdateDto extends StrategyRuleCreateDto {}
