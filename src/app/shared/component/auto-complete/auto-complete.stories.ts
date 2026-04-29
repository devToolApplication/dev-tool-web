import type { Meta, StoryObj } from '@storybook/angular';

import { AutoComplete } from './auto-complete';
import type { SelectOption } from '../select/select';

const options: SelectOption[] = [
  { label: 'Angular', value: 'angular' },
  { label: 'PrimeNG', value: 'primeng' },
  { label: 'Storybook', value: 'storybook' },
  { label: 'Design System', value: 'design-system' }
];

const meta: Meta<AutoComplete> = {
  title: 'Shared/Components/Auto Complete',
  component: AutoComplete,
  args: {
    label: 'Technology',
    placeholder: 'Type to search',
    options,
    value: 'angular',
    helpText: 'Supports free text and suggestions.'
  }
};

export default meta;

type Story = StoryObj<AutoComplete>;

export const Default: Story = {};

export const Invalid: Story = {
  args: {
    value: '',
    invalid: true,
    errorMessage: 'Technology is required'
  }
};
