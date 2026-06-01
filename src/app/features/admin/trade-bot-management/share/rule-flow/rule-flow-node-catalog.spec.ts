import { buildRuleFlowNodeTypes } from './rule-flow-node-catalog';
import type { FlowNode } from '../../../../../shared/ui/flow-builder/models';

describe('rule flow node catalog', () => {
  it('uses native SVG JointJS shapes for production rule nodes', () => {
    const nodeTypes = buildRuleFlowNodeTypes();

    expect(nodeTypes.map(type => [type.type, type.shape])).toEqual([
      ['rule-group', 'rectangle'],
      ['rule-condition', 'rectangle'],
      ['rule-ref', 'rectangle'],
      ['rule-not', 'rectangle'],
    ]);
  });

  it('prints condition operator and operands directly in the node resolvers', () => {
    const conditionType = buildRuleFlowNodeTypes().find(type => type.type === 'rule-condition');
    const node: FlowNode = {
      id: 'condition-1',
      type: 'rule-condition',
      data: {
        operator: 'CROSSOVER',
        operands: [
          { type: 'indicator', indicatorCode: 'EMA_FAST' },
          { type: 'ruleRef', ruleCode: 'TREND_FILTER' },
        ],
        params: { lookback: 3, tolerance: 0.1 },
      },
    };

    expect(conditionType?.labelResolver?.(node)).toBe('CROSSOVER');
    expect(conditionType?.subtitleResolver?.(node)).toBe('EMA_FAST CROSSOVER TREND_FILTER');
    expect(conditionType?.badgeResolver?.(node)).toEqual({ label: 'LB 3 / T 0.1', tone: 'warning' });
  });

  it('prints range conditions with all three operands', () => {
    const conditionType = buildRuleFlowNodeTypes().find(type => type.type === 'rule-condition');
    const node: FlowNode = {
      id: 'condition-1',
      type: 'rule-condition',
      data: {
        operator: 'BETWEEN',
        operands: [
          { type: 'priceSeries', series: 'CLOSE' },
          { type: 'constant', valueType: 'number', value: 10 },
          { type: 'constant', valueType: 'number', value: 20 },
        ],
      },
    };

    expect(conditionType?.subtitleResolver?.(node)).toBe('CLOSEPRICE BETWEEN 10 AND 20');
  });

  it('shows disabled rule nodes as OFF regardless of node type', () => {
    const nodeTypes = buildRuleFlowNodeTypes();

    for (const type of nodeTypes) {
      expect(type.badgeResolver?.({ id: type.type, type: type.type, disabled: true })).toEqual({
        label: 'OFF',
        tone: 'muted',
      });
    }
  });
});
