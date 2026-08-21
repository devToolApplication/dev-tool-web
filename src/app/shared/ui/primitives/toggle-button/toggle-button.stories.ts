import type { Meta, StoryObj } from '@storybook/angular';
import { ToggleButton } from './toggle-button';

const meta: Meta<ToggleButton> = {
  title: 'Shared/Components/Form/ToggleButton',
  component: ToggleButton,
  args: {
    label: 'Dark Mode',
    onLabel: 'Active',
    offLabel: 'Inactive',
    onIcon: 'pi pi-sun',
    offIcon: 'pi pi-moon',
    value: false,
    disabled: false
  }
};

export default meta;

type Story = StoryObj<ToggleButton>;

export const Default: Story = {};

export const CustomLabels: Story = {
  args: {
    onLabel: 'Locked',
    offLabel: 'Unlocked',
    onIcon: 'pi pi-lock',
    offIcon: 'pi pi-lock-open',
    value: true
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: true
  }
};
