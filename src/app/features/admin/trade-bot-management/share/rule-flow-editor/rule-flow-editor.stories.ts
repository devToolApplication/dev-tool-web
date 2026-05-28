import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { RuleFlowEditorComponent } from './rule-flow-editor.component';
import { RuleLogicFormValue } from '../rule-expression-builder/rule-expression.models';

const sampleExpression: RuleLogicFormValue = {
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
        label: 'MACD Crossover',
        operator: 'CROSSOVER',
        operands: [
          { type: 'indicatorOutput', indicatorCode: 'MACD', outputName: 'macd' },
          { type: 'indicatorOutput', indicatorCode: 'MACD', outputName: 'signal' },
        ],
      },
      {
        id: 'not-1',
        type: 'not',
        children: [
          {
            id: 'rule-ref-1',
            type: 'ruleRef',
            ruleCode: 'VOLUME_FILTER',
          },
        ],
      },
    ],
  },
};

const meta: Meta<RuleFlowEditorComponent> = {
  title: 'TradeBot/RuleFlowEditor',
  component: RuleFlowEditorComponent,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<RuleFlowEditorComponent>;

export const Interactive: Story = {
  args: {
    value: sampleExpression,
    readonly: false,
    traceStatuses: [],
  },
};

export const ReadOnly: Story = {
  args: {
    value: sampleExpression,
    readonly: true,
    traceStatuses: [],
  },
};

export const WithTraceHighlights: Story = {
  args: {
    value: sampleExpression,
    readonly: true,
    traceStatuses: [
      { nodeId: 'root-group', status: 'passed' },
      { nodeId: 'cond-1', status: 'passed' },
      { nodeId: 'cond-2', status: 'failed' },
      { nodeId: 'not-1', status: 'unknown' },
      { nodeId: 'rule-ref-1', status: 'unknown' },
    ],
  },
};

export const Empty: Story = {
  args: {
    value: { root: null },
    readonly: false,
    traceStatuses: [],
  },
};
