import type { Meta, StoryObj } from '@storybook/angular';

import { Select, type SelectOption, type SelectOptionGroup } from './select';

const options: SelectOption[] = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' }
];

const groupedOptions: SelectOptionGroup[] = [
  {
    label: 'System status',
    items: [
      { label: 'Draft', value: 'draft' },
      { label: 'Active', value: 'active' },
      { label: 'Paused', value: 'paused' }
    ]
  },
  {
    label: 'Runtime status',
    items: [
      { label: 'Running', value: 'running' },
      { label: 'Stopped', value: 'stopped' },
      { label: 'Failed', value: 'failed', disabled: true }
    ]
  }
];

const meta: Meta<Select> = {
  title: 'Shared/Components/Form Controls/Select',
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

export const Grouped: Story = {
  args: {
    label: 'Status group',
    placeholder: 'Choose status',
    options: groupedOptions,
    group: true,
    value: 'running'
  }
};

export const Loading: Story = {
  args: {
    loading: true
  }
};

export const Disabled: Story = {
  args: {
    disabled: true
  }
};

export const Empty: Story = {
  args: {
    value: null,
    options: []
  }
};

export const Invalid: Story = {
  args: {
    value: null,
    invalid: true,
    errorMessage: 'Status is required'
  }
};
