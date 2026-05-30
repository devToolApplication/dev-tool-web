import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { CandleChartHeaderComponent } from './candle-chart-header.component';

const meta: Meta<CandleChartHeaderComponent> = {
  title: 'Features/Trade Bot/Shared Trading/Candle Chart/Header',
  component: CandleChartHeaderComponent,
  decorators: [moduleMetadata({ imports: [CommonModule] })],
  args: {
    chartTitle: 'XAUUSD - M15 - REPLAY',
    candle: { time: '2024-05-17T09:45:00Z', open: 2341.2, high: 2345.7, low: 2338.1, close: 2343.5, volume: 12400 },
    change: 2.3,
    changePercent: 0.1,
    tone: 'up',
  },
};

export default meta;

type Story = StoryObj<CandleChartHeaderComponent>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    candle: null,
  },
};
