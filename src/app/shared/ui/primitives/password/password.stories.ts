import type { Meta, StoryObj } from '@storybook/angular';
import { Password } from './password';

const meta: Meta<Password> = {
  title: 'Shared/Components/Form/Password',
  component: Password,
  args: {
    label: 'Account Password',
    placeholder: 'Enter secure password',
    feedback: true,
    toggleMask: true,
    disabled: false
  }
};

export default meta;

type Story = StoryObj<Password>;

export const Default: Story = {};

export const NoFeedback: Story = {
  args: {
    feedback: false
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 'secret_value'
  }
};
