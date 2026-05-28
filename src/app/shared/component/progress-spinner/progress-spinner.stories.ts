import type { Meta, StoryObj } from '@storybook/angular';
import { ProgressSpinnerComponent } from './progress-spinner.component';

const meta: Meta<ProgressSpinnerComponent> = {
  title: 'Shared/Components/Feedback/ProgressSpinner',
  component: ProgressSpinnerComponent,
  args: {
    strokeWidth: '4',
    ariaLabel: 'loading'
  }
};

export default meta;

type Story = StoryObj<ProgressSpinnerComponent>;

export const Default: Story = {};

export const CustomStroke: Story = {
  args: {
    strokeWidth: '2'
  }
};
