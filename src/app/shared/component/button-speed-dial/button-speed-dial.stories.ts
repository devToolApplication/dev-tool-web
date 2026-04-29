import type { Meta, StoryObj } from '@storybook/angular';
import type { MenuItem } from 'primeng/api';

import { ButtonSpeedDial } from './button-speed-dial';

const model: MenuItem[] = [
  { label: 'Add', icon: 'pi pi-plus' },
  { label: 'Edit', icon: 'pi pi-pencil' },
  { label: 'Delete', icon: 'pi pi-trash' }
];

const meta: Meta<ButtonSpeedDial> = {
  title: 'Shared/Components/Button Speed Dial',
  component: ButtonSpeedDial,
  parameters: {
    layout: 'padded'
  },
  args: {
    model,
    direction: 'right',
    type: 'linear'
  }
};

export default meta;

type Story = StoryObj<ButtonSpeedDial>;

export const Default: Story = {
  render: (args) => ({
    props: { ...args },
    template: `
      <div class="relative h-32 min-w-80 p-8">
        <app-button-speed-dial
          [model]="model"
          [direction]="direction"
          [type]="type"
          [showIcon]="showIcon"
          [hideIcon]="hideIcon"
        ></app-button-speed-dial>
      </div>
    `
  })
};
