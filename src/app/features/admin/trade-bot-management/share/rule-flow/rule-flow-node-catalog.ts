import { FlowNodeTypeDefinition } from '../../../../../shared/ui/flow-builder/models';
import type { FieldConfig, FormConfig, SelectOption } from '../../../../../shared/ui/form-input/models/form-config.model';
import type { IndicatorConfigResponse, RuleConfigResponse } from '../../data-access/models/trading-system.model';
import {
  RULE_EXPRESSION_BOOLEAN_OPTIONS,
  RULE_EXPRESSION_CONSTANT_TYPES,
  RULE_EXPRESSION_OPERATOR_CATALOG,
  RULE_EXPRESSION_PRICE_SERIES,
  defaultParamsForOperator,
} from '../rule-expression-builder/rule-expression-operators';
import type { RuleExpressionOperandValueType } from '../rule-expression-builder/rule-expression.models';

export interface RuleFlowNodeTypeCatalogOptions {
  indicatorConfigs?: IndicatorConfigResponse[];
  ruleConfigs?: RuleConfigResponse[];
  currentRuleId?: string | null;
}

export function buildRuleFlowNodeTypes(options: RuleFlowNodeTypeCatalogOptions = {}): FlowNodeTypeDefinition[] {
  return [
    {
      type: 'rule-group',
      label: 'Group',
      description: 'Logical rule group',
      shape: 'html',
      defaultSize: { width: 150, height: 78 },
      defaultData: { operator: 'AND' },
      icon: 'pi pi-sitemap',
      tone: 'info',
      ports: [
        { id: 'in', group: 'in', position: 'top' },
        { id: 'out', group: 'out', position: 'bottom' },
      ],
      allowConnectFrom: true,
      allowConnectTo: true,
      allowDelete: true,
      allowMove: true,
      labelResolver: (node) => String(node.data?.['operator'] ?? 'GROUP'),
      badgeResolver: (node) => node.disabled ? { label: 'OFF', tone: 'muted' } : null,
      inspectorForm: groupInspectorForm(),
    },
    {
      type: 'rule-condition',
      label: 'Condition',
      description: 'Comparison or cross condition',
      shape: 'html',
      defaultSize: { width: 290, height: 112 },
      defaultData: {
        operator: null,
        operands: [],
        params: defaultParamsForOperator('CROSSOVER'),
      },
      icon: 'pi pi-code-branch',
      tone: 'warning',
      ports: [
        { id: 'in', group: 'in', position: 'top' },
      ],
      allowConnectFrom: false,
      allowConnectTo: true,
      allowDelete: true,
      allowMove: true,
      labelResolver: (node) => String(node.data?.['operator'] ?? node.label ?? '?'),
      badgeResolver: (node) => node.disabled ? { label: 'OFF', tone: 'muted' } : null,
      inspectorForm: conditionInspectorForm(options),
    },
    {
      type: 'rule-ref',
      label: 'Rule Ref',
      description: 'Referenced child rule',
      shape: 'html',
      defaultSize: { width: 220, height: 72 },
      icon: 'pi pi-share-alt',
      tone: 'primary',
      ports: [
        { id: 'in', group: 'in', position: 'top' },
      ],
      allowConnectFrom: false,
      allowConnectTo: true,
      allowDelete: true,
      allowMove: true,
      labelResolver: (node) => node.data?.['ruleCode'] ? `Rule: ${node.data['ruleCode']}` : 'Rule: ?',
      badgeResolver: (node) => node.disabled ? { label: 'OFF', tone: 'muted' } : { label: 'REF', tone: 'primary' },
      inspectorForm: ruleRefInspectorForm(options),
    },
    {
      type: 'rule-not',
      label: 'NOT',
      description: 'Boolean NOT operator',
      shape: 'html',
      defaultSize: { width: 150, height: 70 },
      icon: 'pi pi-ban',
      tone: 'danger',
      ports: [
        { id: 'in', group: 'in', position: 'top' },
        { id: 'out', group: 'out', position: 'bottom' },
      ],
      allowConnectFrom: true,
      allowConnectTo: true,
      allowDelete: true,
      allowMove: true,
      labelResolver: () => 'NOT',
      badgeResolver: (node) => node.disabled ? { label: 'OFF', tone: 'muted' } : null,
      inspectorForm: notInspectorForm(),
    },
  ];
}

export const RULE_FLOW_NODE_TYPES: FlowNodeTypeDefinition[] = buildRuleFlowNodeTypes();

function baseInspectorForm(partial: FormConfig): FormConfig {
  return {
    layout: {
      sectionNavigation: 'none',
      showStatusPanel: false,
      showValidationSummary: true,
    },
    actions: {
      showCancel: false,
      showReset: false,
    },
    ...partial,
  };
}

function groupInspectorForm(): FormConfig {
  return baseInspectorForm({
    title: 'tradeBot.ruleExpression.type.group',
    fields: [
      {
        name: 'operator',
        type: 'select',
        label: 'tradeBot.ruleExpression.field.groupOperator',
        options: groupOperatorOptions(),
        width: 'full',
        required: true,
      },
      disabledField(),
    ],
  });
}

function conditionInspectorForm(options: RuleFlowNodeTypeCatalogOptions): FormConfig {
  return baseInspectorForm({
    title: 'tradeBot.ruleExpression.type.condition',
    description: 'tradeBot.ruleExpression.nodeConfigSubtitle',
    sections: [
      { id: 'operator', title: 'tradeBot.ruleExpression.field.operator', order: 0 },
      { id: 'operands', title: 'tradeBot.ruleExpression.field.operand', order: 1 },
      { id: 'state', title: 'tradeBot.ruleExpression.disabled', order: 2 },
    ],
    fields: [
      {
        name: 'operator',
        type: 'select',
        label: 'tradeBot.ruleExpression.field.operator',
        placeholder: 'tradeBot.ruleExpression.placeholder.selectOperator',
        options: RULE_EXPRESSION_OPERATOR_CATALOG.map(item => ({ label: item.label, value: item.value })),
        sectionId: 'operator',
        width: 'full',
        required: true,
        validation: [{ type: 'required', message: 'tradeBot.ruleExpression.validation.operatorRequired' }],
      },
      ...crossParamFields(),
      ...operandSlotFields(0, 'tradeBot.ruleExpression.field.leftOperand', options, crossOperatorExpression(), ['numericSeries', 'priceSeries', 'ruleValue']),
      ...operandSlotFields(1, 'tradeBot.ruleExpression.field.rightOperand', options, crossOperatorExpression(), ['numericSeries', 'priceSeries', 'ruleValue']),
      ...operandSlotFields(0, 'tradeBot.ruleExpression.field.leftOperand', options, numericCompareOperatorExpression(), ['numericSeries', 'priceSeries', 'ruleValue', 'number']),
      ...operandSlotFields(1, 'tradeBot.ruleExpression.field.rightOperand', options, numericCompareOperatorExpression(), ['numericSeries', 'priceSeries', 'ruleValue', 'number']),
      ...operandSlotFields(0, 'tradeBot.ruleExpression.field.leftOperand', options, equalityOperatorExpression(), ['numericSeries', 'priceSeries', 'ruleValue', 'number', 'boolean', 'string']),
      ...operandSlotFields(1, 'tradeBot.ruleExpression.field.rightOperand', options, equalityOperatorExpression(), ['numericSeries', 'priceSeries', 'ruleValue', 'number', 'boolean', 'string']),
      ...operandSlotFields(0, 'tradeBot.ruleExpression.field.leftOperand', options, rangeOperatorExpression(), ['numericSeries', 'priceSeries']),
      ...operandSlotFields(1, 'tradeBot.ruleExpression.field.minOperand', options, rangeOperatorExpression(), ['number']),
      ...operandSlotFields(2, 'tradeBot.ruleExpression.field.maxOperand', options, rangeOperatorExpression(), ['number']),
      disabledField('state'),
    ],
  });
}

function ruleRefInspectorForm(options: RuleFlowNodeTypeCatalogOptions): FormConfig {
  return baseInspectorForm({
    title: 'tradeBot.ruleExpression.type.ruleRef',
    fields: [
      {
        name: 'ruleCode',
        type: 'select',
        label: 'tradeBot.ruleExpression.field.ruleRef',
        placeholder: 'tradeBot.ruleExpression.placeholder.selectRule',
        options: ruleOptions(options),
        showClear: true,
        width: 'full',
        required: true,
        validation: [{ type: 'required', message: 'tradeBot.ruleExpression.validation.ruleRefRequired' }],
      },
      disabledField(),
    ],
  });
}

function notInspectorForm(): FormConfig {
  return baseInspectorForm({
    title: 'tradeBot.ruleExpression.type.not',
    description: 'tradeBot.ruleExpression.notConfig',
    fields: [
      disabledField(),
    ],
  });
}

function disabledField(sectionId?: string): FieldConfig {
  return {
    name: 'node.disabled',
    type: 'boolean',
    label: 'tradeBot.ruleExpression.field.disabled',
    sectionId,
    width: 'full',
  };
}

function crossParamFields(): FieldConfig[] {
  const visibleWhen = "model.operator === 'CROSSOVER' || model.operator === 'CROSSUNDER'";
  return [
    {
      name: 'params.lookback',
      type: 'number',
      label: 'tradeBot.ruleExpression.quickParam.lookback',
      helpText: 'tradeBot.ruleExpression.quickParam.lookbackHelp',
      suffix: ' bars',
      sectionId: 'operator',
      visibleWhen,
      width: '1/2',
    },
    {
      name: 'params.tolerance',
      type: 'number',
      label: 'tradeBot.ruleExpression.quickParam.tolerance',
      helpText: 'tradeBot.ruleExpression.quickParam.toleranceHelp',
      suffix: ' value',
      sectionId: 'operator',
      visibleWhen,
      width: '1/2',
    },
  ];
}

function operandSlotFields(
  index: number,
  label: string,
  options: RuleFlowNodeTypeCatalogOptions,
  visibleWhen = "!!model.operator",
  allowedTypes: RuleExpressionOperandValueType[] = ['numericSeries', 'priceSeries', 'ruleValue', 'number', 'boolean', 'string']
): FieldConfig[] {
  const prefix = `operands.${index}`;
  const typePath = `model.operands?.[${index}]?.type`;
  const valueTypePath = `model.operands?.[${index}]?.valueType`;
  const constantTypeOptions = constantOptionsForAllowedTypes(allowedTypes);
  const constantNumberVisible = `${typePath} === 'constant' && (${valueTypePath} == null || ${valueTypePath} === 'number')`;

  return [
    {
      name: `${prefix}.type`,
      type: 'select',
      label,
      options: operandTypeOptions(allowedTypes),
      sectionId: 'operands',
      visibleWhen,
      width: 'full',
    },
    {
      name: `${prefix}.indicatorCode`,
      type: 'select',
      label: 'tradeBot.ruleExpression.field.indicator',
      options: indicatorOptions(options),
      sectionId: 'operands',
      visibleWhen: `${visibleWhen} && (${typePath} === 'indicator' || ${typePath} === 'indicatorOutput')`,
      showClear: true,
      width: 'full',
    },
    {
      name: `${prefix}.outputName`,
      type: 'text',
      label: 'tradeBot.ruleExpression.field.output',
      sectionId: 'operands',
      visibleWhen: `${visibleWhen} && ${typePath} === 'indicatorOutput'`,
      width: 'full',
    },
    {
      name: `${prefix}.series`,
      type: 'select',
      label: 'tradeBot.ruleExpression.field.priceSeries',
      options: RULE_EXPRESSION_PRICE_SERIES.map(series => ({ label: series, value: series })),
      sectionId: 'operands',
      visibleWhen: `${visibleWhen} && ${typePath} === 'priceSeries'`,
      width: 'full',
    },
    {
      name: `${prefix}.ruleCode`,
      type: 'select',
      label: 'tradeBot.ruleExpression.field.ruleRef',
      placeholder: 'tradeBot.ruleExpression.placeholder.selectRule',
      options: ruleOptions(options),
      sectionId: 'operands',
      visibleWhen: `${visibleWhen} && ${typePath} === 'ruleRef'`,
      showClear: true,
      width: 'full',
    },
    {
      name: `${prefix}.valueType`,
      type: 'select',
      label: 'tradeBot.ruleExpression.field.constantType',
      options: constantTypeOptions,
      sectionId: 'operands',
      visibleWhen: `${visibleWhen} && ${typePath} === 'constant' && ${constantTypeOptions.length > 1}`,
      width: 'full',
    },
    {
      name: `${prefix}.value`,
      type: 'number',
      label: 'tradeBot.ruleExpression.field.constantNumber',
      sectionId: 'operands',
      visibleWhen: `${visibleWhen} && ${constantNumberVisible}`,
      width: 'full',
    },
    {
      name: `${prefix}.value`,
      type: 'text',
      label: 'tradeBot.ruleExpression.field.constantText',
      sectionId: 'operands',
      visibleWhen: `${visibleWhen} && ${typePath} === 'constant' && ${valueTypePath} === 'string'`,
      width: 'full',
    },
    {
      name: `${prefix}.value`,
      type: 'select',
      label: 'tradeBot.ruleExpression.field.constantBoolean',
      options: RULE_EXPRESSION_BOOLEAN_OPTIONS,
      sectionId: 'operands',
      visibleWhen: `${visibleWhen} && ${typePath} === 'constant' && ${valueTypePath} === 'boolean'`,
      width: 'full',
    },
  ];
}

function operandTypeOptions(allowedTypes: RuleExpressionOperandValueType[]): SelectOption[] {
  const result: SelectOption[] = [];
  if (allowedTypes.includes('numericSeries')) {
    result.push(
      { label: 'tradeBot.ruleExpression.operand.indicator', value: 'indicator' },
      { label: 'tradeBot.ruleExpression.operand.indicatorOutput', value: 'indicatorOutput' }
    );
  }
  if (allowedTypes.includes('priceSeries')) {
    result.push({ label: 'tradeBot.ruleExpression.operand.priceSeries', value: 'priceSeries' });
  }
  if (allowedTypes.includes('ruleValue')) {
    result.push({ label: 'tradeBot.ruleExpression.operand.ruleRef', value: 'ruleRef' });
  }
  if (allowedTypes.some(type => type === 'number' || type === 'boolean' || type === 'string')) {
    result.push({ label: 'tradeBot.ruleExpression.operand.constant', value: 'constant' });
  }
  return result;
}

function constantOptionsForAllowedTypes(allowedTypes: RuleExpressionOperandValueType[]): SelectOption[] {
  return RULE_EXPRESSION_CONSTANT_TYPES
    .filter(item => allowedTypes.includes(item.value))
    .map(item => ({ label: item.label, value: item.value }));
}

function groupOperatorOptions(): SelectOption[] {
  return [
    { label: 'AND', value: 'AND' },
    { label: 'OR', value: 'OR' },
    { label: 'XOR', value: 'XOR' },
  ];
}

function indicatorOptions(options: RuleFlowNodeTypeCatalogOptions): SelectOption[] {
  return (options.indicatorConfigs ?? [])
    .map(item => ({
      label: `${item.code}${item.status ? ` [${item.status}]` : ''}`,
      value: item.code,
      disabled: item.status === 'INACTIVE' || item.status === 'DISABLED',
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function ruleOptions(options: RuleFlowNodeTypeCatalogOptions): SelectOption[] {
  return (options.ruleConfigs ?? [])
    .filter(item => item.id !== options.currentRuleId)
    .map(item => ({
      label: `${item.code}${item.status ? ` [${item.status}]` : ''}`,
      value: item.code,
      disabled: item.status === 'INACTIVE' || item.status === 'DISABLED',
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function rangeOperatorExpression(): string {
  return "model.operator === 'BETWEEN' || model.operator === 'OUTSIDE'";
}

function crossOperatorExpression(): string {
  return "model.operator === 'CROSSOVER' || model.operator === 'CROSSUNDER'";
}

function numericCompareOperatorExpression(): string {
  return "model.operator === 'GT' || model.operator === 'GTE' || model.operator === 'LT' || model.operator === 'LTE'";
}

function equalityOperatorExpression(): string {
  return "model.operator === 'EQ' || model.operator === 'NEQ'";
}
