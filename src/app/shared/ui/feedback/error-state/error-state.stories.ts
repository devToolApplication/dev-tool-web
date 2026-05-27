import type { Meta, StoryObj } from '@storybook/angular';
import { ErrorStateComponent } from './error-state.component';

const meta: Meta<ErrorStateComponent> = {
  title: 'Shared/UI/Feedback/ErrorState',
  component: ErrorStateComponent,
  args: {
    title: 'shared.error.title',
    message: 'shared.error.message',
    errorCode: 'ERR_TIMEOUT',
    variant: 'danger',
    compact: false,
    showCopyDetail: false
  }
};

export default meta;

type Story = StoryObj<ErrorStateComponent>;

export const Default: Story = {};

export const WithDetail: Story = {
  args: {
    message: 'The server rejected our API request.',
    detail: {
      status: 400,
      url: '/api/v1/workflows',
      error: 'Invalid syntax for field "timeoutSeconds". Must be between 5 and 3600.',
      timestamp: '2026-05-27T13:48:00.000Z'
    },
    showCopyDetail: true
  }
};

export const Compact: Story = {
  args: {
    compact: true,
    message: 'Something went wrong.'
  }
};

export const WarningVariant: Story = {
  args: {
    variant: 'warning',
    title: 'Configuration warning',
    message: 'This workflow is active but has no associated active endpoints.'
  }
};

export const InfoVariant: Story = {
  args: {
    variant: 'info',
    title: 'No connection established',
    message: 'Please pair your device or connect to a local cluster daemon first.'
  }
};

export const WithRetry: Story = {
  args: {
    retryLabel: 'common.retry',
    message: 'Lost connection to database stream. Keep trying?'
  }
};
