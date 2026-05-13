import type { Meta, StoryObj } from '@storybook/angular';
import { RuleTreeViewerComponent } from './rule-tree-viewer.component';

const meta: Meta<RuleTreeViewerComponent> = {
  title: 'Shared/UI/RuleTreeViewer',
  component: RuleTreeViewerComponent,
  args: {
    trace: {
      ruleCode: 'ENTRY_AND',
      operator: 'AND',
      passed: true,
      indicatorValues: { emaFast: 101, emaSlow: 99 },
      children: [
        { ruleCode: 'EMA_CROSS', operator: 'GT', passed: true, message: 'Fast EMA above slow EMA' },
        { ruleCode: 'RSI_FILTER', operator: 'LT', passed: false, reason: 'RSI too high' }
      ]
    }
  }
};

export default meta;

type Story = StoryObj<RuleTreeViewerComponent>;

export const Default: Story = {};
export const Empty: Story = {
  args: { trace: null }
};
