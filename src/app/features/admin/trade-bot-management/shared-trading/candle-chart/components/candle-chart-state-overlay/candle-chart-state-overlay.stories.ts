import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { SharedModule } from '../../../../../../../shared/shared.module';
import { CandleChartStateOverlayComponent } from './candle-chart-state-overlay.component';

const meta: Meta<CandleChartStateOverlayComponent> = {
  title: 'Features/Trade Bot/Shared Trading/Candle Chart/State Overlay',
  component: CandleChartStateOverlayComponent,
  decorators: [moduleMetadata({ imports: [CommonModule, SharedModule] })],
  args: {
    severity: 'empty',
    message: 'tradeBot.chart.state.empty',
  },
};

export default meta;

type Story = StoryObj<CandleChartStateOverlayComponent>;

export const Empty: Story = {};

export const Loading: Story = {
  args: {
    severity: 'loading',
    message: 'tradeBot.chart.state.loading',
  },
};

export const Error: Story = {
  args: {
    severity: 'error',
    message: 'tradeBot.message.loadFailed',
  },
};
