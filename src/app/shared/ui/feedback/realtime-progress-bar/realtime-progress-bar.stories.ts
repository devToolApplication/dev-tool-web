import type { Meta, StoryObj } from '@storybook/angular';
import { RealtimeProgressBarComponent } from './realtime-progress-bar.component';
import type { ProgressState } from './realtime-progress-bar.component';

const meta: Meta<RealtimeProgressBarComponent> = {
  title: 'Shared/UI/Feedback/RealtimeProgressBar',
  component: RealtimeProgressBarComponent,
  args: {
    showCancel: true,
    showDetails: true,
    state: {
      id: 'JOB_001',
      title: 'Data import',
      status: 'running',
      percent: 42,
      current: 420,
      total: 1000,
      step: 'VALIDATING',
      message: 'Import running',
    } satisfies ProgressState,
  },
};

export default meta;

type Story = StoryObj<RealtimeProgressBarComponent>;

export const Default: Story = {};

export const Queued: Story = {
  args: {
    state: {
      id: 'JOB_000',
      title: 'Market data import',
      status: 'queued',
      step: 'WAITING',
      message: 'Waiting for an available worker',
      current: 0,
      total: 1000,
    } satisfies ProgressState,
  },
};

export const RunningIndeterminate: Story = {
  args: {
    state: {
      id: 'JOB_004',
      title: 'Execution trace sync',
      status: 'running',
      step: 'STREAMING',
      message: 'Receiving progress updates',
      cancellable: true,
    } satisfies ProgressState,
  },
};

export const Completed: Story = {
  args: {
    state: {
      id: 'JOB_002',
      title: 'Dataset sync',
      status: 'completed',
      percent: 100,
      step: 'COMPLETED',
      message: 'Dataset sync completed',
    } satisfies ProgressState,
  },
};

export const Failed: Story = {
  args: {
    state: {
      id: 'JOB_005',
      title: 'Policy rollout',
      status: 'failed',
      percent: 64,
      current: 640,
      total: 1000,
      step: 'APPLYING',
      errorMessage: 'Worker returned an error while applying the policy',
    } satisfies ProgressState,
  },
};

export const Cancelled: Story = {
  args: {
    state: {
      id: 'JOB_003',
      title: 'Data import',
      status: 'cancelled',
      percent: 100,
      step: 'CANCELLED',
      message: 'Import was cancelled',
    } satisfies ProgressState,
  },
};
