import type { Meta, StoryObj } from '@storybook/angular';

import { RadioButton } from './radio-button';
import type { SelectOption } from '../../ui/form-input/models/form-config.model';

const options: SelectOption[] = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' }
];

const meta: Meta<RadioButton> = {
  title: 'Shared/Components/Radio Button',
  component: RadioButton,
  args: {
    label: 'Status',
    options,
    value: 'draft',
    labelPosition: 'left',
    optionLayout: 'horizontal'
  }
};

export default meta;

type Story = StoryObj<RadioButton>;

export const Horizontal: Story = {};

export const Vertical: Story = {
  args: {
    optionLayout: 'vertical',
    labelPosition: 'top'
  }
};

export const Invalid: Story = {
  args: {
    value: null,
    invalid: true,
    errorMessage: 'Status is required'
  }
};
