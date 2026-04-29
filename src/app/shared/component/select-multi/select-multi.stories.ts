import type { Meta, StoryObj } from '@storybook/angular';

import { SelectMulti } from './select-multi';
import type { SelectOption } from '../select/select';

const options: SelectOption[] = [
  { label: 'Angular', value: 'angular' },
  { label: 'PrimeNG', value: 'primeng' },
  { label: 'Storybook', value: 'storybook' },
  { label: 'Design System', value: 'design-system' }
];

const meta: Meta<SelectMulti> = {
  title: 'Shared/Components/Select Multi',
  component: SelectMulti,
  args: {
    label: 'Tags',
    placeholder: 'Choose tags',
    options,
    value: ['angular', 'storybook'],
    enableFilter: true,
    display: 'chip'
  }
};

export default meta;

type Story = StoryObj<SelectMulti>;

export const Default: Story = {};

export const Limited: Story = {
  args: {
    selectionLimit: 2,
    maxSelectedLabels: 2
  }
};
