import type { Meta, StoryObj } from '@storybook/angular';
import { DatePicker } from './date-picker';

const meta: Meta<DatePicker> = {
  title: 'Shared/Components/Form/DatePicker',
  component: DatePicker,
  args: {
    label: 'Start Date',
    placeholder: 'Choose date',
    showIcon: true,
    dateFormat: 'dd/mm/yy',
    showTime: false,
    hourFormat: '24',
    selectionMode: 'single',
    disabled: false
  }
};

export default meta;

type Story = StoryObj<DatePicker>;

export const Default: Story = {};

export const WithTime: Story = {
  args: {
    label: 'Start Date & Time',
    showTime: true,
    dateFormat: 'dd/mm/yy'
  }
};

export const RangeSelection: Story = {
  args: {
    label: 'Duration Range',
    selectionMode: 'range',
    placeholder: 'Choose range'
  }
};
