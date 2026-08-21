import type { Meta, StoryObj } from '@storybook/angular';
import { TooltipComponent } from './tooltip';

const meta: Meta<TooltipComponent> = {
  title: 'Shared/Components/Overlay/Tooltip',
  component: TooltipComponent,
  args: {
    text: 'This is a helpful tooltip message',
    position: 'top',
    autoHide: true
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="flex justify-center items-center h-32">
        <app-tooltip [text]="text" [position]="position" [autoHide]="autoHide">
          <app-button label="Hover over me!"></app-button>
        </app-tooltip>
      </div>
    `
  })
};

export default meta;

type Story = StoryObj<TooltipComponent>;

export const Top: Story = {};

export const Bottom: Story = {
  args: {
    position: 'bottom'
  }
};

export const Left: Story = {
  args: {
    position: 'left'
  }
};

export const Right: Story = {
  args: {
    position: 'right'
  }
};
