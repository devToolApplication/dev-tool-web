import type { Meta, StoryObj } from '@storybook/angular';

import { Password } from './password';

const meta: Meta<Password> = {
  title: 'Shared/Components/Password',
  component: Password,
  args: {
    label: 'Password',
    placeholder: 'Enter password',
    value: 'DemoPassword1',
    feedback: true,
    toggleMask: true
  }
};

export default meta;

type Story = StoryObj<Password>;

export const Default: Story = {};

export const Invalid: Story = {
  args: {
    value: '',
    invalid: true,
    errorMessage: 'Password is required'
  }
};
