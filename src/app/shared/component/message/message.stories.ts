import type { Meta, StoryObj } from '@storybook/angular';
import { MessageComponent } from './message';

const meta: Meta<MessageComponent> = {
  title: 'Shared/Components/Feedback/Message',
  component: MessageComponent,
  args: {
    text: 'This is an inline informational message.',
    severity: 'info',
    size: 'small',
    variant: 'simple'
  }
};

export default meta;

type Story = StoryObj<MessageComponent>;

export const Info: Story = {};

export const Success: Story = {
  args: {
    severity: 'success',
    text: 'Operation completed successfully.'
  }
};

export const Warning: Story = {
  args: {
    severity: 'warn',
    text: 'Please review warning details.'
  }
};

export const ErrorSeverity: Story = {
  args: {
    severity: 'error',
    text: 'An error occurred during indexing.'
  }
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    severity: 'success'
  }
};

export const Large: Story = {
  args: {
    size: 'large',
    severity: 'info'
  }
};
