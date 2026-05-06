import type { Meta, StoryObj } from '@storybook/angular';

import { SelectButton } from './select-button';
import type { SelectOption } from '../select/select';

const options: SelectOption[] = [
  { label: 'active', value: 'active' },
  { label: 'inactive', value: 'inactive' },
  { label: 'custom', value: 'custom' }
];

const meta: Meta<SelectButton> = {
  title: 'Shared/Components/Select Button',
  component: SelectButton,
  args: {
    label: 'status',
    options,
    value: 'active',
    allowEmpty: true
  }
};

export default meta;

type Story = StoryObj<SelectButton>;

export const Default: Story = {};

export const Multiple: Story = {
  args: {
    multiple: true,
    value: ['active', 'custom'] as never
  }
};

export const Disabled: Story = {
  args: {
    disabled: true
  }
};

export const Invalid: Story = {
  args: {
    invalid: true,
    errorMessage: 'selectValue'
  }
};

export const Empty: Story = {
  args: {
    value: null,
    options: [],
    helpText: 'noDataFound'
  }
};
