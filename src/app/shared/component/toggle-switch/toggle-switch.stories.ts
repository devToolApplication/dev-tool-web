import type { Meta, StoryObj } from '@storybook/angular';
import { ToggleSwitch } from './toggle-switch';

const meta: Meta<ToggleSwitch> = {
  title: 'Shared/Components/Form/ToggleSwitch',
  component: ToggleSwitch,
  args: {
    label: 'Enable notifications',
    value: false,
    disabled: false
  }
};

export default meta;

type Story = StoryObj<ToggleSwitch>;

export const Default: Story = {};

export const On: Story = {
  args: {
    value: true
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: true
  }
};
