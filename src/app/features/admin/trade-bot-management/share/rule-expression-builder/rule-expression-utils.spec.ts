import { RuleConfigResponse } from '../../data-access/models/trading-system.model';
import { deriveChildRulesFromExpression, extractRuleExpressionDependencies } from './rule-expression-dependencies';
import {
  createRuleExpressionCondition,
  createRuleExpressionGroup,
  createRuleExpressionNot,
  createRuleExpressionRuleRef
} from './rule-expression-factory';
import { ruleExpressionFromLegacyChildRules } from './rule-expression-legacy';
import { printRuleExpression } from './rule-expression-printer';
import { validateRuleExpression } from './rule-expression-validator';

describe('rule expression utilities', () => {
  it('prints nested groups and skips disabled nodes', () => {
    const expression = {
      root: createRuleExpressionGroup('OR', [
        createRuleExpressionCondition({
          id: 'condition-1',
          operator: 'GT',
          operands: [
            { type: 'priceSeries', series: 'CLOSE' },
            { type: 'constant', valueType: 'number', value: 100 }
          ]
        }),
        createRuleExpressionGroup('AND', [
          createRuleExpressionRuleRef('CONFIRM_VOLUME', { id: 'rule-1' }),
          createRuleExpressionRuleRef('DISABLED_CONFIRM', { id: 'rule-2', disabled: true })
        ], { id: 'group-1' })
      ], { id: 'root' })
    };

    expect(printRuleExpression(expression)).toBe('CLOSEPRICE GT 100 OR CONFIRM_VOLUME');
  });

  it('validates group, not, xor, default condition and range constraints', () => {
    expect(validateRuleExpression({ root: null }).errors[0].message).toBe('tradeBot.ruleExpression.validation.rootRequired');

    const defaultCondition = createRuleExpressionCondition({ id: 'default-condition' });
    expect(defaultCondition.operator).toBe('CROSSOVER');
    expect(defaultCondition.params).toEqual({ lookback: 1, tolerance: 0 });
    expect(validateRuleExpression({ root: defaultCondition }).errors[0].message).toBe('tradeBot.ruleExpression.validation.operandRequired');

    const xor = createRuleExpressionGroup('XOR', [createRuleExpressionRuleRef('A')], { id: 'xor' });
    expect(validateRuleExpression({ root: xor }).errors[0].message).toBe('tradeBot.ruleExpression.validation.xorChildCount');

    const not = createRuleExpressionNot([], { id: 'not' });
    expect(validateRuleExpression({ root: not }).errors[0].message).toBe('tradeBot.ruleExpression.validation.notChildCount');

    const range = createRuleExpressionCondition({
      id: 'range',
      operator: 'BETWEEN',
      operands: [
        { type: 'priceSeries', series: 'CLOSE' },
        { type: 'constant', valueType: 'number', value: 10 },
        { type: 'constant', valueType: 'number', value: 5 }
      ]
    });
    expect(validateRuleExpression({ root: range }).errors[0].message).toBe('tradeBot.ruleExpression.validation.rangeOrder');
  });

  it('allows rule references for crossover operands because runtime compares rule values', () => {
    const expression = createRuleExpressionCondition({
      id: 'rule-value-crossover',
      operator: 'CROSSOVER',
      operands: [
        { type: 'ruleRef', ruleCode: 'TREND_FILTER' },
        { type: 'priceSeries', series: 'CLOSEPRICE' }
      ]
    });

    expect(validateRuleExpression({ root: expression }).errors.some((error) =>
      error.message === 'tradeBot.ruleExpression.validation.incompatibleOperand'
    )).toBe(false);

    const ruleToRule = createRuleExpressionCondition({
      id: 'rule-value-comparison',
      operator: 'GT',
      operands: [
        { type: 'ruleRef', ruleCode: 'FAST_RULE' },
        { type: 'ruleRef', ruleCode: 'SLOW_RULE' }
      ]
    });
    expect(validateRuleExpression({ root: ruleToRule }).errors.some((error) =>
      error.message === 'tradeBot.ruleExpression.validation.incompatibleOperand'
    )).toBe(false);
  });

  it('extracts dependencies and derives active childRules from rule refs', () => {
    const expression = {
      root: createRuleExpressionGroup('AND', [
        createRuleExpressionCondition({
          id: 'condition',
          operator: 'GT',
          operands: [
            { type: 'indicatorOutput', indicatorCode: 'EMA_FAST', outputName: 'VALUE' },
            { type: 'priceSeries', series: 'CLOSE' }
          ]
        }),
        createRuleExpressionRuleRef('CONFIRM_VOLUME', { id: 'rule-ref', slotCode: 'confirm', params: { lookback: 10 } }),
        createRuleExpressionRuleRef('DISABLED_RULE', { id: 'disabled-rule', disabled: true })
      ], { id: 'root' })
    };

    expect(extractRuleExpressionDependencies(expression)).toEqual({
      indicatorCodes: ['EMA_FAST'],
      ruleCodes: ['CONFIRM_VOLUME'],
      priceSeries: ['CLOSE']
    });
    expect(deriveChildRulesFromExpression(expression)).toEqual([
      { ruleCode: 'CONFIRM_VOLUME', slotCode: 'confirm', config: { lookback: 10 } }
    ]);
  });

  it('converts legacy childRules to simple ruleRef expression nodes', () => {
    const expression = ruleExpressionFromLegacyChildRules([
      { ruleCode: 'FIRST_CHILD', slotCode: 'confirm' },
      {
        ruleCode: 'SECOND_CHILD',
        children: [{ ruleCode: 'NESTED_CHILD' }]
      }
    ]);

    expect(expression.root).toEqual(expect.objectContaining({ type: 'group', operator: 'AND' }));
    expect(deriveChildRulesFromExpression(expression)).toEqual([
      { ruleCode: 'FIRST_CHILD', slotCode: 'confirm' },
      { ruleCode: 'SECOND_CHILD' },
      { ruleCode: 'NESTED_CHILD' }
    ]);
  });

  it('detects inactive, self and circular rule references', () => {
    const ruleConfigs: RuleConfigResponse[] = [
      {
        id: 'rule-child',
        code: 'CHILD',
        executor: 'TREND',
        executorVersion: 'v1',
        config: {},
        indicators: [],
        childRules: [{ ruleCode: 'CURRENT' }],
        overlay: {},
        status: 'ACTIVE'
      },
      {
        id: 'rule-disabled',
        code: 'DISABLED_CHILD',
        executor: 'TREND',
        executorVersion: 'v1',
        config: {},
        indicators: [],
        childRules: [],
        overlay: {},
        status: 'INACTIVE'
      }
    ];

    const circular = validateRuleExpression(
      { root: createRuleExpressionRuleRef('CHILD', { id: 'child' }) },
      { currentRuleCode: 'CURRENT', ruleConfigs }
    );
    expect(circular.errors.some((error) => error.message.includes('CURRENT -> CHILD -> CURRENT'))).toBe(true);

    const inactive = validateRuleExpression(
      { root: createRuleExpressionRuleRef('DISABLED_CHILD', { id: 'disabled' }) },
      { currentRuleCode: 'CURRENT', ruleConfigs }
    );
    expect(inactive.warnings[0].message).toBe('tradeBot.validation.inactiveChildRule');

    const self = validateRuleExpression(
      { root: createRuleExpressionRuleRef('CURRENT', { id: 'self' }) },
      { currentRuleCode: 'CURRENT', ruleConfigs }
    );
    expect(self.errors[0].message).toBe('tradeBot.validation.selfChildRule');
  });
});
