import type { Meta, StoryObj } from '@storybook/angular';

import { ProgressSpinnerComponent } from './progress-spinner.component';

const meta: Meta<ProgressSpinnerComponent> = {
  title: 'Shared/Components/ProgressSpinner',
  component: ProgressSpinnerComponent,
  args: {
    strokeWidth: '4'
  }
};

export default meta;

type Story = StoryObj<ProgressSpinnerComponent>;

export const Default: Story = {};

export const Thin: Story = {
  args: {
    strokeWidth: '2'
  }
};
