import type { Meta, StoryObj } from '@storybook/angular';
import { InputNumber } from './input-number';

const meta: Meta<InputNumber> = {
  title: 'Shared/Components/Form/InputNumber',
  component: InputNumber,
  args: {
    label: 'Quantity',
    placeholder: 'Enter quantity',
    value: null,
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    showClear: false
  }
};

export default meta;

type Story = StoryObj<InputNumber>;

export const Default: Story = {};

export const Currency: Story = {
  args: {
    label: 'Price',
    placeholder: 'Enter amount',
    mode: 'currency',
    currency: 'USD',
    min: 0,
    max: 1000000,
    minFractionDigits: 2,
    maxFractionDigits: 2
  }
};

export const WithMinMax: Story = {
  args: {
    label: 'Percentage limit',
    min: 0,
    max: 100,
    value: 50,
    suffix: '%'
  }
};

export const WithStep: Story = {
  args: {
    label: 'Stepped Quantity',
    step: 5,
    value: 20
  }
};
