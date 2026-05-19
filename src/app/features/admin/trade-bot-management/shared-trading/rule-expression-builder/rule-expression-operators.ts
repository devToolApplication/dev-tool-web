import {
  RuleExpressionConditionOperator,
  RuleExpressionOperandType,
  RuleExpressionPriceSeries
} from './rule-expression.models';

export type RuleExpressionOperatorArity = 'binary' | 'range';

export interface RuleExpressionOperatorDefinition {
  value: RuleExpressionConditionOperator;
  label: string;
  arity: RuleExpressionOperatorArity;
  numericOnly: boolean;
  allowBoolean: boolean;
  allowRuleRef: boolean;
}

export const RULE_EXPRESSION_PRICE_SERIES: RuleExpressionPriceSeries[] = [
  'OPEN',
  'HIGH',
  'LOW',
  'CLOSE',
  'VOLUME',
  'CLOSEPRICE'
];

export const RULE_EXPRESSION_OPERAND_TYPES: Array<{ label: string; value: RuleExpressionOperandType }> = [
  { label: 'tradeBot.ruleExpression.operand.indicator', value: 'indicator' },
  { label: 'tradeBot.ruleExpression.operand.indicatorOutput', value: 'indicatorOutput' },
  { label: 'tradeBot.ruleExpression.operand.priceSeries', value: 'priceSeries' },
  { label: 'tradeBot.ruleExpression.operand.ruleRef', value: 'ruleRef' },
  { label: 'tradeBot.ruleExpression.operand.constant', value: 'constant' }
];

export const RULE_EXPRESSION_CONSTANT_TYPES: Array<{ label: string; value: string }> = [
  { label: 'tradeBot.ruleExpression.constant.number', value: 'number' },
  { label: 'tradeBot.ruleExpression.constant.string', value: 'string' },
  { label: 'tradeBot.ruleExpression.constant.boolean', value: 'boolean' }
];

export const RULE_EXPRESSION_BOOLEAN_OPTIONS: Array<{ label: string; value: boolean }> = [
  { label: 'true', value: true },
  { label: 'false', value: false }
];

export const RULE_EXPRESSION_OPERATOR_CATALOG: RuleExpressionOperatorDefinition[] = [
  {
    value: 'CROSSOVER',
    label: 'tradeBot.ruleExpression.operator.CROSSOVER',
    arity: 'binary',
    numericOnly: true,
    allowBoolean: false,
    allowRuleRef: false
  },
  {
    value: 'CROSSUNDER',
    label: 'tradeBot.ruleExpression.operator.CROSSUNDER',
    arity: 'binary',
    numericOnly: true,
    allowBoolean: false,
    allowRuleRef: false
  },
  {
    value: 'GT',
    label: 'tradeBot.ruleExpression.operator.GT',
    arity: 'binary',
    numericOnly: true,
    allowBoolean: false,
    allowRuleRef: false
  },
  {
    value: 'GTE',
    label: 'tradeBot.ruleExpression.operator.GTE',
    arity: 'binary',
    numericOnly: true,
    allowBoolean: false,
    allowRuleRef: false
  },
  {
    value: 'LT',
    label: 'tradeBot.ruleExpression.operator.LT',
    arity: 'binary',
    numericOnly: true,
    allowBoolean: false,
    allowRuleRef: false
  },
  {
    value: 'LTE',
    label: 'tradeBot.ruleExpression.operator.LTE',
    arity: 'binary',
    numericOnly: true,
    allowBoolean: false,
    allowRuleRef: false
  },
  {
    value: 'EQ',
    label: 'tradeBot.ruleExpression.operator.EQ',
    arity: 'binary',
    numericOnly: false,
    allowBoolean: true,
    allowRuleRef: true
  },
  {
    value: 'NEQ',
    label: 'tradeBot.ruleExpression.operator.NEQ',
    arity: 'binary',
    numericOnly: false,
    allowBoolean: true,
    allowRuleRef: true
  },
  {
    value: 'BETWEEN',
    label: 'tradeBot.ruleExpression.operator.BETWEEN',
    arity: 'range',
    numericOnly: true,
    allowBoolean: false,
    allowRuleRef: false
  },
  {
    value: 'OUTSIDE',
    label: 'tradeBot.ruleExpression.operator.OUTSIDE',
    arity: 'range',
    numericOnly: true,
    allowBoolean: false,
    allowRuleRef: false
  }
];

export function operatorDefinition(
  value: RuleExpressionConditionOperator | null | undefined
): RuleExpressionOperatorDefinition | null {
  return RULE_EXPRESSION_OPERATOR_CATALOG.find((item) => item.value === value) ?? null;
}

