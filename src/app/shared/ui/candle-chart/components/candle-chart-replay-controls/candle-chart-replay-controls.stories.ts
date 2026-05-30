import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { SharedModule } from '../../../../shared.module';
import { CandleChartReplayControlsComponent } from './candle-chart-replay-controls.component';

const meta: Meta<CandleChartReplayControlsComponent> = {
  title: 'Features/Trade Bot/Shared Trading/Candle Chart/Replay Controls',
  component: CandleChartReplayControlsComponent,
  decorators: [moduleMetadata({ imports: [SharedModule] })],
  args: {
    isPlaying: false,
    speedMs: 650,
    speedOptions: [
      { label: '0.5x', value: 1000 },
      { label: '1x', value: 650 },
      { label: '2x', value: 300 },
    ],
  },
};

export default meta;

type Story = StoryObj<CandleChartReplayControlsComponent>;

export const Paused: Story = {};

export const Playing: Story = {
  args: {
    isPlaying: true,
  },
};
