import type { Meta, StoryObj } from '@storybook/angular';
import { SelectButton } from './select-button';

const sampleOptions = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' }
];

const meta: Meta<SelectButton> = {
  title: 'Shared/Components/Form/SelectButton',
  component: SelectButton,
  args: {
    options: sampleOptions,
    value: 'week',
    multiple: false,
    allowEmpty: true,
    disabled: false
  }
};

export default meta;

type Story = StoryObj<SelectButton>;

export const Default: Story = {};

export const Multiple: Story = {
  render: (args) => ({
    props: {
      ...args,
      multiple: true,
      value: ['day', 'week']
    },
    template: `
      <app-select-button [options]="options" [multiple]="true" [allowEmpty]="allowEmpty" [value]="value"></app-select-button>
    `
  })
};

export const Disabled: Story = {
  args: {
    disabled: true
  }
};
