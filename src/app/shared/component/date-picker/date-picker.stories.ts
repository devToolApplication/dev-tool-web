import type { Meta, StoryObj } from '@storybook/angular';

import { DatePicker } from './date-picker';

const meta: Meta<DatePicker> = {
  title: 'Shared/Components/Date Picker',
  component: DatePicker,
  args: {
    label: 'Start date',
    placeholder: 'Select date',
    value: new Date(2026, 3, 29),
    showIcon: true
  }
};

export default meta;

type Story = StoryObj<DatePicker>;

export const Default: Story = {};

export const WithTime: Story = {
  args: {
    label: 'Run at',
    showTime: true,
    hourFormat: '24',
    value: new Date(2026, 3, 29, 9, 30)
  }
};

export const Range: Story = {
  args: {
    label: 'Date range',
    selectionMode: 'range',
    value: [new Date(2026, 3, 20), new Date(2026, 3, 29)]
  }
};
