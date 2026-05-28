import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonSpeedDial } from './button-speed-dial';

const sampleMenuItems = [
  { icon: 'pi pi-pencil', tooltip: 'Edit' },
  { icon: 'pi pi-trash', tooltip: 'Delete' },
  { icon: 'pi pi-share-alt', tooltip: 'Share' }
];

const meta: Meta<ButtonSpeedDial> = {
  title: 'Shared/Components/Form/ButtonSpeedDial',
  component: ButtonSpeedDial,
  args: {
    model: sampleMenuItems,
    direction: 'up',
    type: 'linear',
    showIcon: 'pi pi-bars',
    hideIcon: 'pi pi-times',
    ariaLabel: 'Open actions menu'
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="flex justify-center items-center h-48">
        <app-button-speed-dial
          [model]="model"
          [direction]="direction"
          [type]="type"
          [showIcon]="showIcon"
          [hideIcon]="hideIcon"
          [ariaLabel]="ariaLabel"
        ></app-button-speed-dial>
      </div>
    `
  })
};

export default meta;

type Story = StoryObj<ButtonSpeedDial>;

export const Default: Story = {};

export const Circle: Story = {
  args: {
    type: 'circle'
  }
};

export const Down: Story = {
  args: {
    direction: 'down'
  }
};
