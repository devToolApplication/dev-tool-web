import type { Meta, StoryObj } from '@storybook/angular';

import { ToggleButton } from './toggle-button';

const meta: Meta<ToggleButton> = {
  title: 'Shared/Components/Toggle Button',
  component: ToggleButton,
  args: {
    label: 'Mode',
    value: true,
    onLabel: 'Enabled',
    offLabel: 'Disabled',
    onIcon: 'pi pi-check',
    offIcon: 'pi pi-times'
  }
};

export default meta;

type Story = StoryObj<ToggleButton>;

export const Default: Story = {};

export const Invalid: Story = {
  args: {
    invalid: true,
    errorMessage: 'Toggle must be enabled'
  }
};
