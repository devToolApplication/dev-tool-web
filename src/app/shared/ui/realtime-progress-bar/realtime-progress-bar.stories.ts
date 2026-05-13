import type { Meta, StoryObj } from '@storybook/angular';
import { RealtimeProgressBarComponent } from './realtime-progress-bar.component';

const meta: Meta<RealtimeProgressBarComponent> = {
  title: 'Shared/UI/RealtimeProgressBar',
  component: RealtimeProgressBarComponent,
  args: {
    showCancel: true,
    showDetails: true,
    state: {
      taskId: 'RUN_001',
      taskType: 'BACKTEST',
      status: 'PROGRESS',
      progressPercent: 42,
      current: 420,
      total: 1000,
      step: 'RUNNING',
      message: 'Backtest running'
    }
  }
};

export default meta;

type Story = StoryObj<RealtimeProgressBarComponent>;

export const Default: Story = {};
export const Completed: Story = {
  args: {
    state: {
      taskId: 'RUN_002',
      taskType: 'MARKET_DATA_SYNC',
      status: 'COMPLETED',
      progressPercent: 100,
      step: 'COMPLETED',
      message: 'Candle sync completed'
    }
  }
};

export const Skipped: Story = {
  args: {
    state: {
      taskId: 'RUN_003',
      taskType: 'MARKET_DATA_SYNC',
      status: 'SKIPPED',
      progressPercent: 100,
      step: 'SKIPPED',
      message: 'Sync lock is already held'
    }
  }
};
