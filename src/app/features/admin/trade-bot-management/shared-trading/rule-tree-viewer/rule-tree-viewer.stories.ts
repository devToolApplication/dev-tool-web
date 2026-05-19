import type { Meta, StoryObj } from '@storybook/angular';
import { RuleTreeViewerComponent } from './rule-tree-viewer.component';

const trace = {
  ruleCode: 'ENTRY_AND',
  operator: 'AND',
  passed: false,
  indicatorValues: { emaFast: 101, emaSlow: 99 },
  children: [
    {
      ruleCode: 'TREND_FILTER',
      operator: 'AND',
      passed: true,
      children: [
        { ruleCode: 'EMA_CROSS', operator: 'GT', passed: true, message: 'Fast EMA above slow EMA' },
        { ruleCode: 'ADX_STRENGTH', operator: 'GTE', passed: true, message: 'ADX above threshold' }
      ]
    },
    {
      ruleCode: 'MOMENTUM_FILTER',
      operator: 'AND',
      passed: false,
      reason: 'RSI too high for long entry',
      children: [
        { ruleCode: 'RSI_RANGE', operator: 'LT', passed: false, reason: 'RSI=74.2, threshold=68' },
        { ruleCode: 'VOLUME_SPIKE', operator: 'GTE', result: 'UNKNOWN', message: 'Volume feed missing' }
      ]
    },
    {
      ruleCode: 'RISK_GUARD',
      operator: 'OR',
      result: 'UNKNOWN',
      children: [
        { ruleCode: 'MAX_DRAWDOWN', operator: 'LTE', passed: true },
        { ruleCode: 'SESSION_WINDOW', operator: 'BETWEEN', result: 'UNKNOWN' }
      ]
    }
  ]
};

const meta: Meta<RuleTreeViewerComponent> = {
  title: 'Features/Trade Bot/Shared Trading/Rule Tree Viewer',
  component: RuleTreeViewerComponent,
  args: { trace }
};

export default meta;

type Story = StoryObj<RuleTreeViewerComponent>;

export const Default: Story = {};

export const DeepTree: Story = {
  args: {
    trace: {
      ruleCode: 'STRATEGY_ENTRY',
      operator: 'AND',
      passed: false,
      children: [
        trace,
        {
          ruleCode: 'PULLBACK_CONFIRMATION',
          operator: 'AND',
          passed: true,
          children: [
            { ruleCode: 'CANDLE_BODY', operator: 'GTE', passed: true, message: 'Body size accepted' },
            { ruleCode: 'SUPPORT_RETEST', operator: 'PASSED', passed: true, message: 'Price retested support' }
          ]
        }
      ]
    }
  }
};

export const Empty: Story = {
  args: { trace: null }
};
