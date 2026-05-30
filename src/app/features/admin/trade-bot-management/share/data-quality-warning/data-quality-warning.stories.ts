import type { Meta, StoryObj } from '@storybook/angular';
import { DataQualityWarningComponent } from './data-quality-warning.component';

const meta: Meta<DataQualityWarningComponent> = {
  title: 'Features/Trade Bot/Data Quality Warning',
  component: DataQualityWarningComponent,
  args: {
    candles: [
      { symbol: 'BTCUSDT', timeframe: '1m', openTime: '2026-01-01T00:00:00Z', closeTime: '2026-01-01T00:00:59Z', open: 1, high: 2, low: 1, close: 2 },
      { symbol: 'BTCUSDT', timeframe: '1m', openTime: '2026-01-01T00:03:00Z', closeTime: '2026-01-01T00:03:59Z', open: 2, high: 3, low: 2, close: 3 }
    ],
    gaps: [
      { id: 'gap-1', source: 'BINANCE_USDM', symbol: 'BTCUSDT', timeframe: '1m', expectedOpenTime: '2026-01-01T00:01:00Z', status: 'OPEN' }
    ],
    snapshot: { warnings: ['missing-bars'] }
  }
};

export default meta;

type Story = StoryObj<DataQualityWarningComponent>;

export const Warning: Story = {};

export const Healthy: Story = {
  args: {
    candles: [
      { symbol: 'BTCUSDT', timeframe: '1m', openTime: '2026-01-01T00:00:00Z', closeTime: '2026-01-01T00:00:59Z', open: 1, high: 2, low: 1, close: 2 },
      { symbol: 'BTCUSDT', timeframe: '1m', openTime: '2026-01-01T00:01:00Z', closeTime: '2026-01-01T00:01:59Z', open: 2, high: 3, low: 2, close: 3 }
    ],
    gaps: [],
    snapshot: null
  }
};
