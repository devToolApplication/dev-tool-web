import type { Meta, StoryObj } from '@storybook/angular';

import { TradeBotChartResponse } from '../../../core/models/trade-bot/chart-query.model';
import { CandleChartPreviewComponent } from './candle-chart-preview.component';

const baseTime = Date.UTC(2026, 0, 1, 9, 0, 0);

const response: TradeBotChartResponse = {
  candlestickData: [
    { utcTimeStamp: baseTime, open: 100, high: 106, low: 98, close: 104, volume: 1200 },
    { utcTimeStamp: baseTime + 60_000, open: 104, high: 108, low: 103, close: 107, volume: 1480 },
    { utcTimeStamp: baseTime + 120_000, open: 107, high: 109, low: 101, close: 102, volume: 1690 },
    { utcTimeStamp: baseTime + 180_000, open: 102, high: 105, low: 99, close: 104, volume: 1320 }
  ],
  lineData: [
    {
      name: 'PA Support Zone',
      color: 'var(--app-chart-success)',
      from: { time: baseTime + 60_000, value: 101 },
      to: { time: baseTime + 180_000, value: 101 }
    }
  ],
  areaData: [
    {
      from: baseTime + 60_000,
      to: baseTime + 180_000,
      minPrice: 99,
      maxPrice: 102,
      color: 'var(--app-chart-success-fill)'
    }
  ],
  pointData: [
    {
      name: 'Entry',
      shape: 'circle',
      time: baseTime + 60_000,
      value: 104
    }
  ],
  indicatorData: []
};

const meta: Meta<CandleChartPreviewComponent> = {
  title: 'Shared/UI/CandleChartPreview',
  component: CandleChartPreviewComponent,
  args: {
    title: 'tradeBot.strategyRule.test.chartPreview',
    description: 'tradeBot.strategyRule.test.chartPreviewDescription',
    response
  }
};

export default meta;

type Story = StoryObj<CandleChartPreviewComponent>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    loading: true
  }
};

export const Empty: Story = {
  args: {
    response: {
      candlestickData: [],
      lineData: [],
      areaData: [],
      pointData: [],
      indicatorData: []
    }
  }
};
