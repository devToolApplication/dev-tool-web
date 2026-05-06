import type { Meta, StoryObj } from '@storybook/angular';

import { TradeBotCandleResponse } from '../../../core/models/trade-bot/chart-query.model';
import { TradeBotChartPreviewComponent } from './trade-bot-chart-preview.component';

const baseTime = Date.UTC(2026, 0, 1, 9, 0, 0);

const response: TradeBotCandleResponse = {
  candlestickData: [
    { utcTimeStamp: baseTime, open: 100, high: 106, low: 98, close: 104, volume: 1200 },
    { utcTimeStamp: baseTime + 60_000, open: 104, high: 108, low: 103, close: 107, volume: 1480 },
    { utcTimeStamp: baseTime + 120_000, open: 107, high: 109, low: 101, close: 102, volume: 1690 },
    { utcTimeStamp: baseTime + 180_000, open: 102, high: 105, low: 99, close: 104, volume: 1320 }
  ],
  lineData: [
    {
      name: 'UPTREND',
      from: { time: baseTime, value: 99 },
      to: { time: baseTime + 180_000, value: 105 }
    }
  ],
  areaData: [
    {
      name: 'Demand zone',
      from: baseTime,
      to: baseTime + 180_000,
      minPrice: 98,
      maxPrice: 101
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
  indicatorData: [
    {
      name: 'RSI',
      type: 'SUBCHART',
      value: [48, 52, 55, 51]
    }
  ]
};

const meta: Meta<TradeBotChartPreviewComponent> = {
  title: 'Shared/Components/TradeBotChartPreview',
  component: TradeBotChartPreviewComponent,
  args: {
    response
  }
};

export default meta;

type Story = StoryObj<TradeBotChartPreviewComponent>;

export const Default: Story = {};

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
