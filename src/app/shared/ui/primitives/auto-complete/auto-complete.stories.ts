import type { Meta, StoryObj } from '@storybook/angular';
import { AutoComplete } from './auto-complete';

const sampleOptions = [
  { label: 'Nguyen An', value: 'Nguyen An' },
  { label: 'Tran Binh', value: 'Tran Binh' },
  { label: 'Le Chi', value: 'Le Chi' },
  { label: 'Pham Duc', value: 'Pham Duc' }
];

const meta: Meta<AutoComplete> = {
  title: 'Shared/Components/Form/AutoComplete',
  component: AutoComplete,
  args: {
    label: 'Owner',
    placeholder: 'Search and select owner...',
    options: sampleOptions,
    value: '',
    disabled: false
  }
};

export default meta;

type Story = StoryObj<AutoComplete>;

export const Default: Story = {};

export const WithInitialValue: Story = {
  args: {
    value: 'Tran Binh'
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 'Nguyen An'
  }
};
