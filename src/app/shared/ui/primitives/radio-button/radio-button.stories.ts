import type { Meta, StoryObj } from '@storybook/angular';
import { RadioButton } from './radio-button';

const sampleOptions = [
  { label: 'Email', value: 'email' },
  { label: 'Slack Chat', value: 'slack' },
  { label: 'Webhook API', value: 'webhook' }
];

const meta: Meta<RadioButton> = {
  title: 'Shared/Components/Form/RadioButton',
  component: RadioButton,
  args: {
    label: 'Notification Channel',
    options: sampleOptions,
    value: 'email',
    labelPosition: 'left',
    optionLayout: 'horizontal',
    disabled: false
  }
};

export default meta;

type Story = StoryObj<RadioButton>;

export const Default: Story = {};

export const Vertical: Story = {
  args: {
    optionLayout: 'vertical'
  }
};

export const TopLabel: Story = {
  args: {
    labelPosition: 'top',
    optionLayout: 'vertical'
  }
};
