import type { Meta, StoryObj } from '@storybook/angular';
import { DialogComponent } from './dialog';

const meta: Meta<DialogComponent> = {
  title: 'Shared/Components/Overlay/Dialog',
  component: DialogComponent,
  args: {
    visible: true,
    header: 'Dialog Header Title',
    modal: true,
    dismissableMask: false,
    closeOnEscape: true,
    closable: true,
    draggable: false,
    resizable: false,
    maximizable: false,
    position: 'center'
  },
  render: (args) => ({
    props: args,
    template: `
      <div>
        <p class="text-sm p-4 bg-muted border rounded">Note: Dialog has "visible: true" by default to be rendered in Storybook.</p>
        <app-dialog
          [visible]="visible"
          [header]="header"
          [modal]="modal"
          [dismissableMask]="dismissableMask"
          [closeOnEscape]="closeOnEscape"
          [closable]="closable"
          [draggable]="draggable"
          [resizable]="resizable"
          [maximizable]="maximizable"
          [position]="position"
          [width]="width"
          [blockScroll]="blockScroll"
        >
          <div class="p-4">
            <p>This is the standard content inside the dialog body.</p>
          </div>
        </app-dialog>
      </div>
    `
  })
};

export default meta;

type Story = StoryObj<DialogComponent>;

export const Default: Story = {};

export const Maximizable: Story = {
  args: {
    maximizable: true
  }
};

export const Draggable: Story = {
  args: {
    draggable: true
  }
};
