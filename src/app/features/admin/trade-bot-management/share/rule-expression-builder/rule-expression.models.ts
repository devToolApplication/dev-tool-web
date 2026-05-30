import {
  IndicatorConfigResponse,
  RuleConfigResponse
} from '../../data-access/models/trading-system.model';

export type RuleExpressionNodeType = 'group' | 'condition' | 'ruleRef' | 'not';
export type RuleExpressionGroupOperator = 'AND' | 'OR' | 'XOR';
export type RuleExpressionConditionOperator =
  | 'CROSSOVER'
  | 'CROSSUNDER'
  | 'GT'
  | 'GTE'
  | 'LT'
  | 'LTE'
  | 'EQ'
  | 'NEQ'
  | 'BETWEEN'
  | 'OUTSIDE';
export type RuleExpressionOperandType =
  | 'indicator'
  | 'indicatorOutput'
  | 'priceSeries'
  | 'ruleRef'
  | 'constant';
export type RuleExpressionPriceSeries = 'OPEN' | 'HIGH' | 'LOW' | 'CLOSE' | 'VOLUME' | 'CLOSEPRICE';
export type RuleExpressionConstantType = 'number' | 'string' | 'boolean';
export type RuleExpressionOperandValueType =
  | 'numericSeries'
  | 'priceSeries'
  | 'ruleValue'
  | 'number'
  | 'boolean'
  | 'string';
export type RuleExpressionOperatorSlotName = 'left' | 'right' | 'min' | 'max';
export type RuleExpressionValidationSeverity = 'error' | 'warning';

export interface RuleExpressionOperand {
  type: RuleExpressionOperandType;
  indicatorCode?: string;
  outputName?: string;
  series?: RuleExpressionPriceSeries;
  ruleCode?: string;
  value?: string | number | boolean | null;
  valueType?: RuleExpressionConstantType;
}

export interface RuleExpressionBaseNode {
  id: string;
  type: RuleExpressionNodeType;
  label?: string;
  disabled?: boolean;
  params?: Record<string, unknown>;
}

export interface RuleExpressionGroupNode extends RuleExpressionBaseNode {
  type: 'group';
  operator: RuleExpressionGroupOperator;
  children: RuleExpressionNode[];
}

export interface RuleExpressionConditionNode extends RuleExpressionBaseNode {
  type: 'condition';
  operator: RuleExpressionConditionOperator | null;
  operands: RuleExpressionOperand[];
}

export interface RuleExpressionRuleRefNode extends RuleExpressionBaseNode {
  type: 'ruleRef';
  ruleCode: string;
  slotCode?: string;
}

export interface RuleExpressionNotNode extends RuleExpressionBaseNode {
  type: 'not';
  children: RuleExpressionNode[];
}

export type RuleExpressionNode =
  | RuleExpressionGroupNode
  | RuleExpressionConditionNode
  | RuleExpressionRuleRefNode
  | RuleExpressionNotNode;

export interface RuleLogicFormValue {
  root: RuleExpressionNode | null;
}

export interface RuleExpressionValidationIssue {
  nodeId?: string;
  path?: string;
  message: string;
  severity: RuleExpressionValidationSeverity;
}

export interface RuleExpressionValidationResult {
  valid: boolean;
  issues: RuleExpressionValidationIssue[];
  errors: RuleExpressionValidationIssue[];
  warnings: RuleExpressionValidationIssue[];
}

export interface RuleExpressionValidationContext {
  indicatorConfigs?: IndicatorConfigResponse[];
  ruleConfigs?: RuleConfigResponse[];
  currentRuleCode?: string | null;
  currentRuleId?: string | null;
}

export interface RuleExpressionDependencySummary {
  indicatorCodes: string[];
  ruleCodes: string[];
  priceSeries: RuleExpressionPriceSeries[];
}

export interface RuleExpressionOption {
  label: string;
  value: string;
  disabled?: boolean;
}
