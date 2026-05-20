import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { SharedModule } from '../../../../../../../shared/shared.module';
import { CandleChartToolbarComponent } from './candle-chart-toolbar.component';

const meta: Meta<CandleChartToolbarComponent> = {
  title: 'Features/Trade Bot/Shared Trading/Candle Chart/Toolbar',
  component: CandleChartToolbarComponent,
  decorators: [moduleMetadata({ imports: [SharedModule] })],
  args: {
    status: 'READY',
    mode: 'REPLAY',
    isPlaying: false,
    fullscreen: false,
    overlayToggleOptions: [
      { key: 'entries', label: 'tradeBot.chart.overlay.entries' },
      { key: 'exits', label: 'tradeBot.chart.overlay.exits' },
      { key: 'stopLoss', label: 'tradeBot.chart.overlay.stopLoss' },
      { key: 'takeProfit', label: 'tradeBot.chart.overlay.takeProfit' },
    ],
    activeOverlayFilters: {
      entries: true,
      exits: true,
      stopLoss: true,
      takeProfit: true,
    },
  },
};

export default meta;

type Story = StoryObj<CandleChartToolbarComponent>;

export const Default: Story = {};

export const Playing: Story = {
  args: {
    status: 'PLAYING',
    isPlaying: true,
  },
};
