import type { Meta, StoryObj } from '@storybook/angular';

import { InputNumber } from './input-number';

const meta: Meta<InputNumber> = {
  title: 'Shared/Components/Input Number',
  component: InputNumber,
  args: {
    label: 'Capital',
    placeholder: 'Enter amount',
    value: 125000,
    min: 0,
    step: 1000,
    showClear: true
  }
};

export default meta;

type Story = StoryObj<InputNumber>;

export const Decimal: Story = {};

export const Currency: Story = {
  args: {
    mode: 'currency',
    currency: 'USD',
    minFractionDigits: 0,
    maxFractionDigits: 0
  }
};

export const Invalid: Story = {
  args: {
    invalid: true,
    errorMessage: 'Amount must be greater than 0'
  }
};
