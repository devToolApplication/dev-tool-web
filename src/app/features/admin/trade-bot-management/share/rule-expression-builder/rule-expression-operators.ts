import {
  RuleExpressionConditionOperator,
  RuleExpressionConstantType,
  RuleExpressionOperand,
  RuleExpressionOperandType,
  RuleExpressionOperandValueType,
  RuleExpressionOperatorSlotName,
  RuleExpressionPriceSeries
} from './rule-expression.models';

export type RuleExpressionOperatorArity = 'binary' | 'range';
export type RuleExpressionQuickParamType = 'number' | 'text' | 'boolean';

export interface RuleExpressionOperatorSlot {
  name: RuleExpressionOperatorSlotName;
  label: string;
  allowedValueTypes: RuleExpressionOperandValueType[];
}

export interface RuleExpressionQuickParamDefinition {
  key: string;
  label: string;
  type: RuleExpressionQuickParamType;
  defaultValue: unknown;
  helpText: string;
  suffix?: string;
}

export interface RuleExpressionOperatorDefinition {
  value: RuleExpressionConditionOperator;
  label: string;
  arity: RuleExpressionOperatorArity;
  slots: RuleExpressionOperatorSlot[];
  quickParams?: RuleExpressionQuickParamDefinition[];
  description: string;
}

const NUMERIC_SERIES_TYPES: RuleExpressionOperandValueType[] = ['numericSeries', 'priceSeries'];
const NUMERIC_VALUE_TYPES: RuleExpressionOperandValueType[] = ['numericSeries', 'priceSeries', 'number'];
const COMPARABLE_VALUE_TYPES: RuleExpressionOperandValueType[] = [
  'numericSeries',
  'priceSeries',
  'number',
  'boolean',
  'string'
];

const CROSS_SIGNAL_PARAMS: RuleExpressionQuickParamDefinition[] = [
  {
    key: 'lookback',
    label: 'tradeBot.ruleExpression.quickParam.lookback',
    type: 'number',
    defaultValue: 1,
    suffix: ' bars',
    helpText: 'tradeBot.ruleExpression.quickParam.lookbackHelp'
  },
  {
    key: 'tolerance',
    label: 'tradeBot.ruleExpression.quickParam.tolerance',
    type: 'number',
    defaultValue: 0,
    suffix: ' value',
    helpText: 'tradeBot.ruleExpression.quickParam.toleranceHelp'
  }
];

export const RULE_EXPRESSION_PRICE_SERIES: RuleExpressionPriceSeries[] = [
  'CLOSEPRICE',
  'OPEN',
  'HIGH',
  'LOW',
  'CLOSE',
  'VOLUME'
];

export const RULE_EXPRESSION_OPERAND_TYPES: Array<{ label: string; value: RuleExpressionOperandType }> = [
  { label: 'tradeBot.ruleExpression.operand.indicator', value: 'indicator' },
  { label: 'tradeBot.ruleExpression.operand.indicatorOutput', value: 'indicatorOutput' },
  { label: 'tradeBot.ruleExpression.operand.priceSeries', value: 'priceSeries' },
  { label: 'tradeBot.ruleExpression.operand.ruleRef', value: 'ruleRef' },
  { label: 'tradeBot.ruleExpression.operand.constant', value: 'constant' }
];

export const RULE_EXPRESSION_CONSTANT_TYPES: Array<{ label: string; value: RuleExpressionConstantType }> = [
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
    slots: binarySlots(NUMERIC_SERIES_TYPES),
    quickParams: CROSS_SIGNAL_PARAMS,
    description: 'tradeBot.ruleExpression.operatorDescription.CROSSOVER'
  },
  {
    value: 'CROSSUNDER',
    label: 'tradeBot.ruleExpression.operator.CROSSUNDER',
    arity: 'binary',
    slots: binarySlots(NUMERIC_SERIES_TYPES),
    quickParams: CROSS_SIGNAL_PARAMS,
    description: 'tradeBot.ruleExpression.operatorDescription.CROSSUNDER'
  },
  {
    value: 'GT',
    label: 'tradeBot.ruleExpression.operator.GT',
    arity: 'binary',
    slots: binarySlots(NUMERIC_VALUE_TYPES),
    description: 'tradeBot.ruleExpression.operatorDescription.GT'
  },
  {
    value: 'GTE',
    label: 'tradeBot.ruleExpression.operator.GTE',
    arity: 'binary',
    slots: binarySlots(NUMERIC_VALUE_TYPES),
    description: 'tradeBot.ruleExpression.operatorDescription.GTE'
  },
  {
    value: 'LT',
    label: 'tradeBot.ruleExpression.operator.LT',
    arity: 'binary',
    slots: binarySlots(NUMERIC_VALUE_TYPES),
    description: 'tradeBot.ruleExpression.operatorDescription.LT'
  },
  {
    value: 'LTE',
    label: 'tradeBot.ruleExpression.operator.LTE',
    arity: 'binary',
    slots: binarySlots(NUMERIC_VALUE_TYPES),
    description: 'tradeBot.ruleExpression.operatorDescription.LTE'
  },
  {
    value: 'EQ',
    label: 'tradeBot.ruleExpression.operator.EQ',
    arity: 'binary',
    slots: binarySlots(COMPARABLE_VALUE_TYPES),
    description: 'tradeBot.ruleExpression.operatorDescription.EQ'
  },
  {
    value: 'NEQ',
    label: 'tradeBot.ruleExpression.operator.NEQ',
    arity: 'binary',
    slots: binarySlots(COMPARABLE_VALUE_TYPES),
    description: 'tradeBot.ruleExpression.operatorDescription.NEQ'
  },
  {
    value: 'BETWEEN',
    label: 'tradeBot.ruleExpression.operator.BETWEEN',
    arity: 'range',
    slots: [
      {
        name: 'left',
        label: 'tradeBot.ruleExpression.field.leftOperand',
        allowedValueTypes: NUMERIC_SERIES_TYPES
      },
      {
        name: 'min',
        label: 'tradeBot.ruleExpression.field.minOperand',
        allowedValueTypes: ['number']
      },
      {
        name: 'max',
        label: 'tradeBot.ruleExpression.field.maxOperand',
        allowedValueTypes: ['number']
      }
    ],
    description: 'tradeBot.ruleExpression.operatorDescription.BETWEEN'
  },
  {
    value: 'OUTSIDE',
    label: 'tradeBot.ruleExpression.operator.OUTSIDE',
    arity: 'range',
    slots: [
      {
        name: 'left',
        label: 'tradeBot.ruleExpression.field.leftOperand',
        allowedValueTypes: NUMERIC_SERIES_TYPES
      },
      {
        name: 'min',
        label: 'tradeBot.ruleExpression.field.minOperand',
        allowedValueTypes: ['number']
      },
      {
        name: 'max',
        label: 'tradeBot.ruleExpression.field.maxOperand',
        allowedValueTypes: ['number']
      }
    ],
    description: 'tradeBot.ruleExpression.operatorDescription.OUTSIDE'
  }
];

export function operatorDefinition(
  value: RuleExpressionConditionOperator | null | undefined
): RuleExpressionOperatorDefinition | null {
  return RULE_EXPRESSION_OPERATOR_CATALOG.find((item) => item.value === value) ?? null;
}

export function operatorSlotDefinition(
  operator: RuleExpressionConditionOperator | null | undefined,
  slotName: RuleExpressionOperatorSlotName
): RuleExpressionOperatorSlot | null {
  return operatorDefinition(operator)?.slots.find((slot) => slot.name === slotName) ?? null;
}

export function operandValueTypes(operand: RuleExpressionOperand | null | undefined): RuleExpressionOperandValueType[] {
  if (!operand) {
    return [];
  }
  if (operand.type === 'indicator' || operand.type === 'indicatorOutput') {
    return ['numericSeries'];
  }
  if (operand.type === 'priceSeries') {
    return ['priceSeries'];
  }
  if (operand.type === 'ruleRef') {
    return ['boolean'];
  }
  if (operand.valueType === 'boolean') {
    return ['boolean'];
  }
  if (operand.valueType === 'string') {
    return ['string'];
  }
  return ['number'];
}

export function defaultParamsForOperator(
  operator: RuleExpressionConditionOperator | null | undefined
): Record<string, unknown> | undefined {
  const quickParams = operatorDefinition(operator)?.quickParams ?? [];
  if (!quickParams.length) {
    return undefined;
  }
  return quickParams.reduce<Record<string, unknown>>((params, item) => {
    params[item.key] = item.defaultValue;
    return params;
  }, {});
}

function binarySlots(allowedValueTypes: RuleExpressionOperandValueType[]): RuleExpressionOperatorSlot[] {
  return [
    {
      name: 'left',
      label: 'tradeBot.ruleExpression.field.leftOperand',
      allowedValueTypes
    },
    {
      name: 'right',
      label: 'tradeBot.ruleExpression.field.rightOperand',
      allowedValueTypes
    }
  ];
}
