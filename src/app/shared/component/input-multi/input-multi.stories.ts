import type { Meta, StoryObj } from '@storybook/angular';
import { InputMulti } from './input-multi';

const sampleOptions = [
  { label: 'PRD', value: 'PRD' },
  { label: 'OPS', value: 'OPS' },
  { label: 'QA', value: 'QA' },
  { label: 'DEV', value: 'DEV' }
];

const meta: Meta<InputMulti> = {
  title: 'Shared/Components/Form/InputMulti',
  component: InputMulti,
  args: {
    label: 'Tags',
    placeholder: 'Type tag and press Enter',
    options: sampleOptions,
    value: [],
    disabled: false
  }
};

export default meta;

type Story = StoryObj<InputMulti>;

export const Default: Story = {};

export const WithOptions: Story = {
  args: {
    value: ['PRD', 'OPS']
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: ['QA', 'DEV']
  }
};
