import type { Meta, StoryObj } from '@storybook/angular';

import { SelectButton } from './select-button';
import type { SelectOption } from '../select/select';

const options: SelectOption[] = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' }
];

const meta: Meta<SelectButton> = {
  title: 'Shared/Components/Select Button',
  component: SelectButton,
  args: {
    label: 'Status',
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
    value: ['draft', 'active'] as never
  }
};
