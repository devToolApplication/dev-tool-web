import type { Meta, StoryObj } from '@storybook/angular';
import { SelectMulti } from './select-multi';

const sampleOptions = [
  { label: 'QA Environment', value: 'qa' },
  { label: 'Production Environment', value: 'prod' },
  { label: 'Staging Environment', value: 'staging' },
  { label: 'Development Environment', value: 'dev' }
];

const meta: Meta<SelectMulti> = {
  title: 'Shared/Components/Form/SelectMulti',
  component: SelectMulti,
  args: {
    label: 'Deployment Targets',
    placeholder: 'Choose targets',
    options: sampleOptions,
    display: 'chip',
    enableFilter: false,
    loading: false,
    disabled: false
  }
};

export default meta;

type Story = StoryObj<SelectMulti>;

export const Default: Story = {};

export const WithFilter: Story = {
  args: {
    enableFilter: true,
    placeholder: 'Search and select target'
  }
};

export const WithLimit: Story = {
  args: {
    selectionLimit: 2,
    placeholder: 'Max 2 targets'
  }
};

export const LoadingState: Story = {
  args: {
    loading: true
  }
};
