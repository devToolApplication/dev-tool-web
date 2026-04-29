import type { Meta, StoryObj } from '@storybook/angular';

import { CandleChart, type CandleChartConfig, type CandleChartPayload } from './candle-chart';

const config: CandleChartConfig = {
  showCandles: true,
  showVolume: true,
  showLines: true,
  showBoxAreas: true,
  showPoints: true,
  showIndicators: true
};

const data: CandleChartPayload = {
  candles: [
    { time: '09:00', open: 101, close: 104, low: 99, high: 105, volume: 220 },
    { time: '10:00', open: 104, close: 102, low: 100, high: 106, volume: 180 },
    { time: '11:00', open: 102, close: 108, low: 101, high: 109, volume: 260 },
    { time: '12:00', open: 108, close: 111, low: 106, high: 113, volume: 310 },
    { time: '13:00', open: 111, close: 107, low: 105, high: 112, volume: 275 },
    { time: '14:00', open: 107, close: 114, low: 106, high: 115, volume: 330 },
    { time: '15:00', open: 114, close: 118, low: 112, high: 119, volume: 390 },
    { time: '16:00', open: 118, close: 116, low: 114, high: 120, volume: 285 }
  ],
  lines: [
    {
      name: 'Trend',
      color: '#2563eb',
      start: 101,
      end: 118,
      startTime: '09:00',
      endTime: '16:00'
    }
  ],
  boxAreas: [
    {
      name: 'Range',
      color: 'rgba(59, 130, 246, 0.14)',
      startTime: '10:00',
      endTime: '13:00',
      high: 113,
      low: 100
    }
  ],
  points: [
    { name: 'Entry', color: '#16a34a', shape: 'arrowUp', startTime: '11:00', price: 108 },
    { name: 'Exit', color: '#dc2626', shape: 'arrowDown', startTime: '16:00', price: 116 }
  ],
  indicators: [
    {
      name: 'MA',
      color: '#f59e0b',
      pane: 'overlay',
      values: [101, 103, 104, 107, 108, 110, 113, 115]
    },
    {
      name: 'RSI',
      color: '#7c3aed',
      pane: 'subchart',
      values: [44, 48, 57, 62, 55, 66, 71, 63]
    }
  ]
};

const meta: Meta<CandleChart> = {
  title: 'Shared/Components/Candle Chart',
  component: CandleChart,
  parameters: {
    layout: 'padded'
  },
  args: {
    config,
    data
  }
};

export default meta;

type Story = StoryObj<CandleChart>;

export const Default: Story = {};
