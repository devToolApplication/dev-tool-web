import type { Meta, StoryObj } from '@storybook/angular';
import { CheckBox } from './check-box';

const meta: Meta<CheckBox> = {
  title: 'Shared/Components/Form/CheckBox',
  component: CheckBox,
  args: {
    label: 'Accept terms and conditions',
    value: false,
    indeterminate: false,
    disabled: false,
    hideLabel: false
  }
};

export default meta;

type Story = StoryObj<CheckBox>;

export const Default: Story = {};

export const Checked: Story = {
  args: {
    value: true
  }
};

export const Indeterminate: Story = {
  args: {
    indeterminate: true
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: true
  }
};

export const HiddenLabel: Story = {
  args: {
    hideLabel: true,
    ariaLabel: 'Toggle terms acceptance'
  }
};
