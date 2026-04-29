import type { Meta, StoryObj } from '@storybook/angular';

import { InputMulti } from './input-multi';
import type { SelectOption } from '../select/select';

const options: SelectOption[] = [
  { label: 'BTCUSDT', value: 'BTCUSDT' },
  { label: 'ETHUSDT', value: 'ETHUSDT' },
  { label: 'SOLUSDT', value: 'SOLUSDT' }
];

const meta: Meta<InputMulti> = {
  title: 'Shared/Components/Input Multi',
  component: InputMulti,
  args: {
    label: 'Symbols',
    placeholder: 'Type and press enter',
    options,
    value: ['BTCUSDT', 'ETHUSDT'],
    helpText: 'Allows suggestions and custom values.'
  }
};

export default meta;

type Story = StoryObj<InputMulti>;

export const Default: Story = {};
