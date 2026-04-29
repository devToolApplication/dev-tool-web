import type { Meta, StoryObj } from '@storybook/angular';

import { ToggleSwitch } from './toggle-switch';

const meta: Meta<ToggleSwitch> = {
  title: 'Shared/Components/Toggle Switch',
  component: ToggleSwitch,
  args: {
    label: 'Live mode',
    value: true,
    helpText: 'Simple boolean switch.'
  }
};

export default meta;

type Story = StoryObj<ToggleSwitch>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true
  }
};
