import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { SharedModule } from '../../shared.module';
import {
  CandleChart,
  type CandleChartConfig,
  type CandleChartPayload,
  type ChartCandle,
  type ChartIndicator,
  type ChartOverlay,
} from './candle-chart';
import { CandleChartHeaderComponent } from './components/candle-chart-header/candle-chart-header.component';
import { CandleChartReplayControlsComponent } from './components/candle-chart-replay-controls/candle-chart-replay-controls.component';
import { CandleChartStateOverlayComponent } from './components/candle-chart-state-overlay/candle-chart-state-overlay.component';
import { CandleChartToolbarComponent } from './components/candle-chart-toolbar/candle-chart-toolbar.component';

const config: CandleChartConfig = {
  showCandles: true,
  showVolume: true,
  showLines: true,
  showBoxAreas: true,
  showPoints: true,
  showIndicators: true,
  symbol: 'AAPL',
  interval: '1D',
  exchange: 'NASDAQ',
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
    { time: '16:00', open: 118, close: 116, low: 114, high: 120, volume: 285 },
  ],
  lines: [
    {
      name: 'Trend',
      color: 'var(--app-chart-primary)',
      start: 101,
      end: 118,
      startTime: '09:00',
      endTime: '16:00',
    },
  ],
  boxAreas: [
    {
      name: 'Range',
      color: 'var(--app-chart-primary-fill)',
      startTime: '10:00',
      endTime: '13:00',
      high: 113,
      low: 100,
    },
  ],
  points: [
    {
      name: 'Entry',
      color: 'var(--app-chart-success)',
      shape: 'arrowUp',
      startTime: '11:00',
      price: 108,
    },
    {
      name: 'Exit',
      color: 'var(--app-chart-danger)',
      shape: 'arrowDown',
      startTime: '16:00',
      price: 116,
    },
  ],
  indicators: [
    {
      name: 'MA',
      color: 'var(--app-chart-warning)',
      pane: 'overlay',
      values: [101, 103, 104, 107, 108, 110, 113, 115],
    },
    {
      name: 'RSI',
      color: 'var(--app-chart-violet)',
      pane: 'subchart',
      values: [44, 48, 57, 62, 55, 66, 71, 63],
    },
  ],
};

const candles: ChartCandle[] = data.candles.map((candle, index) => ({ ...candle, index }));

const strategyOverlays: ChartOverlay[] = [
  {
    id: 'entry',
    type: 'MARKER',
    category: 'ENTRY',
    source: 'STRATEGY',
    index: 3,
    price: 111,
    text: 'ENTRY BUY',
    shape: 'arrowUp',
    color: 'var(--app-chart-success)',
  },
  {
    id: 'sl',
    type: 'PRICE_LINE',
    category: 'STOP_LOSS',
    source: 'STRATEGY',
    price: 106,
    text: 'SL',
    color: 'var(--app-chart-danger)',
  },
  {
    id: 'tp',
    type: 'PRICE_LINE',
    category: 'TAKE_PROFIT',
    source: 'STRATEGY',
    price: 121,
    text: 'TP',
    color: 'var(--app-chart-success)',
  },
];

const typedIndicators: ChartIndicator[] = [
  {
    code: 'MACD',
    name: 'MACD',
    pane: 'SUB',
    type: 'LINE',
    color: 'var(--app-chart-info)',
    values: [0.1, 0.2, 0.35, 0.3, 0.24, 0.31, 0.42, 0.28],
  },
  {
    code: 'MACD_SIGNAL',
    name: 'MACD Signal',
    pane: 'SUB',
    type: 'LINE',
    color: 'var(--app-chart-danger)',
    values: [0.08, 0.14, 0.22, 0.27, 0.25, 0.27, 0.34, 0.31],
  },
  {
    code: 'MACD_HISTOGRAM',
    name: 'MACD Histogram',
    pane: 'SUB',
    type: 'HISTOGRAM',
    color: 'var(--app-chart-warning)',
    values: [0.02, 0.06, 0.13, 0.03, -0.01, 0.04, 0.08, -0.03],
  },
  {
    code: 'RSI',
    name: 'RSI',
    pane: 'SUB',
    type: 'AREA',
    color: 'var(--app-chart-violet)',
    values: [44, 48, 57, 62, 55, 66, 71, 63],
  },
];

const meta: Meta<CandleChart> = {
  title: 'Features/Trade Bot/Candle Chart',
  component: CandleChart,
  decorators: [
    moduleMetadata({
      declarations: [
        CandleChartHeaderComponent,
        CandleChartReplayControlsComponent,
        CandleChartStateOverlayComponent,
        CandleChartToolbarComponent,
      ],
      imports: [SharedModule],
    }),
  ],
  parameters: {
    layout: 'padded',
  },
  args: {
    config,
    data,
  },
};

export default meta;

type Story = StoryObj<CandleChart>;

export const Default: Story = {};

export const WithOverlayLabels: Story = {
  args: {
    config: {
      ...config,
      showOverlayLabels: true,
      showPriceAxisLabels: true,
    },
  },
};

export const PriceOnly: Story = {
  args: {
    config: {
      ...config,
      showVolume: false,
      showBoxAreas: false,
      showPoints: false,
      showIndicators: false,
    },
  },
};

export const WithoutPreviewBar: Story = {
  args: {
    config: {
      ...config,
      showPreviewBar: false,
    },
  },
};

export const Empty: Story = {
  args: {
    data: {
      candles: [],
      lines: [],
      boxAreas: [],
      points: [],
      indicators: [],
    },
  },
};

export const HistoricalRuntime: Story = {
  args: {
    mode: 'HISTORICAL',
    config: {
      ...config,
      showToolbar: true,
      showOverlayLabels: true,
    },
    candles,
    overlays: strategyOverlays,
  },
};

export const ReplayRuntime: Story = {
  args: {
    mode: 'REPLAY',
    config: {
      ...config,
      showReplayControls: true,
      showToolbar: true,
      showOverlayLabels: true,
    },
    replayConfig: {
      initialIndex: 2,
      speedMs: 650,
      loop: false,
    },
    candles,
    overlays: strategyOverlays,
  },
};

export const RealtimeReady: Story = {
  args: {
    mode: 'REALTIME',
    config: {
      ...config,
      showToolbar: true,
    },
    realtimeConfig: {
      enabled: false,
      reconnect: true,
    },
    candles,
  },
};

export const EvaluationOverlays: Story = {
  args: {
    mode: 'REPLAY',
    config: {
      ...config,
      showReplayControls: true,
      showDebugPanel: true,
      showOverlayLabels: true,
    },
    candles,
    overlays: strategyOverlays,
  },
};

export const IndicatorTypes: Story = {
  args: {
    mode: 'HISTORICAL',
    config: {
      ...config,
      showIndicators: true,
      showToolbar: true,
      showOverlayLabels: true,
    },
    candles,
    indicators: typedIndicators,
  },
};
