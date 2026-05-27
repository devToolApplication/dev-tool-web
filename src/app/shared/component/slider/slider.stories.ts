import type { Meta, StoryObj } from '@storybook/angular';
import { SliderComponent } from './slider';

const meta: Meta<SliderComponent> = {
  title: 'Shared/Components/Form/Slider',
  component: SliderComponent,
  args: {
    min: 0,
    max: 100,
    value: 50
  }
};

export default meta;

type Story = StoryObj<SliderComponent>;

export const Default: Story = {};

export const CustomRange: Story = {
  args: {
    min: 0,
    max: 1000,
    value: 250
  }
};
