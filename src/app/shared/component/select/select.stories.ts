import type { Meta, StoryObj } from '@storybook/angular';

import { Select, type SelectOption } from './select';

const options: SelectOption[] = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' }
];

const meta: Meta<Select> = {
  title: 'Shared/Components/Select',
  component: Select,
  args: {
    label: 'Status',
    placeholder: 'Choose status',
    options,
    value: 'active',
    showClear: true
  }
};

export default meta;

type Story = StoryObj<Select>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    loading: true
  }
};

export const Invalid: Story = {
  args: {
    value: null,
    invalid: true,
    errorMessage: 'Status is required'
  }
};
