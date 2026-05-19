import type { Meta, StoryObj } from '@storybook/angular';

import { InputMulti } from './input-multi';
import type { SelectOption } from '../select/select';

const options: SelectOption[] = [
  { label: 'PRD', value: 'PRD' },
  { label: 'OPS', value: 'OPS' },
  { label: 'QA', value: 'QA' }
];

const meta: Meta<InputMulti> = {
  title: 'Shared/Components/Form Controls/Input Multi',
  component: InputMulti,
  args: {
    label: 'Codes',
    placeholder: 'Type and press enter',
    options,
    value: ['PRD', 'OPS'],
    helpText: 'Allows suggestions and custom values.'
  }
};

export default meta;

type Story = StoryObj<InputMulti>;

export const Default: Story = {};
