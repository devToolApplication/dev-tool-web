import type { Meta, StoryObj } from '@storybook/angular';

import { SummaryMetricCardComponent } from './summary-metric-card.component';

const meta: Meta<SummaryMetricCardComponent> = {
  title: 'Shared/UI/SummaryMetricCard',
  component: SummaryMetricCardComponent,
  args: {
    label: 'totalRecords',
    value: 128,
    suffix: ''
  }
};

export default meta;

type Story = StoryObj<SummaryMetricCardComponent>;

export const Default: Story = {};

export const WithSuffix: Story = {
  args: {
    label: 'tradeBot.replay.metric.winRate',
    value: 64,
    suffix: '%'
  }
};

export const Empty: Story = {
  args: {
    value: null
  }
};
