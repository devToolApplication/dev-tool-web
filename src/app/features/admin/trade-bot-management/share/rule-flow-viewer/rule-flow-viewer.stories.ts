import { Meta, StoryObj } from '@storybook/angular';
import { RuleFlowViewerComponent } from './rule-flow-viewer.component';
import { RuleLogicFormValue } from '../rule-expression-builder/rule-expression.models';

const sampleRuleLogic: RuleLogicFormValue = {
  root: {
    id: 'root-group',
    type: 'group',
    operator: 'AND',
    children: [
      {
        id: 'cond-1',
        type: 'condition',
        label: 'RSI > 70',
        operator: 'GT',
        operands: [
          { type: 'indicatorOutput', indicatorCode: 'RSI', outputName: 'value' },
          { type: 'constant', value: 70, valueType: 'number' },
        ],
      },
      {
        id: 'cond-2',
        type: 'condition',
        label: 'EMA Cross',
        operator: 'CROSSOVER',
        operands: [
          { type: 'indicatorOutput', indicatorCode: 'EMA_FAST', outputName: 'value' },
          { type: 'indicatorOutput', indicatorCode: 'EMA_SLOW', outputName: 'value' },
        ],
      },
    ],
  },
};

const sampleTrace: Record<string, unknown> = {
  ruleId: 'root-group',
  ruleCode: 'ENTRY_RULE',
  operator: 'AND',
  passed: true,
  children: [
    {
      ruleId: 'cond-1',
      ruleCode: 'RSI_CHECK',
      operator: 'GT',
      passed: true,
      message: 'RSI = 75.3 > 70',
    },
    {
      ruleId: 'cond-2',
      ruleCode: 'EMA_CROSS',
      operator: 'CROSSOVER',
      passed: false,
      message: 'No crossover detected',
    },
  ],
};

const meta: Meta<RuleFlowViewerComponent> = {
  title: 'TradeBot/RuleFlowViewer',
  component: RuleFlowViewerComponent,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<RuleFlowViewerComponent>;

export const WithTrace: Story = {
  args: {
    ruleLogic: sampleRuleLogic,
    trace: sampleTrace,
  },
};

export const NoTrace: Story = {
  args: {
    ruleLogic: sampleRuleLogic,
    trace: null,
  },
};

export const EmptyRule: Story = {
  args: {
    ruleLogic: { root: null },
    trace: null,
  },
};
