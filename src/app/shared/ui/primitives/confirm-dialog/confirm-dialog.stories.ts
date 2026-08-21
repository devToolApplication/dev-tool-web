import type { Meta, StoryObj } from '@storybook/angular';
import { PrimeConfirmDialogComponent } from './confirm-dialog';

const meta: Meta<PrimeConfirmDialogComponent> = {
  title: 'Shared/Components/Overlay/ConfirmDialog (Legacy)',
  component: PrimeConfirmDialogComponent,
  args: {
    key: 'confirm-dialog-demo',
    header: 'Confirmation Dialog Title',
    message: 'Are you sure you want to perform this action?',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Yes, proceed',
    rejectLabel: 'No, cancel',
    closable: true
  }
};

export default meta;

type Story = StoryObj<PrimeConfirmDialogComponent>;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div>
        <p class="text-sm p-4 border rounded mb-4">Note: This is a legacy wrapper. Use app-confirm-dialog-host for new code.</p>
        <app-confirm-dialog
          [key]="key"
          [header]="header"
          [message]="message"
          [icon]="icon"
          [acceptLabel]="acceptLabel"
          [rejectLabel]="rejectLabel"
          [closable]="closable"
        ></app-confirm-dialog>
      </div>
    `
  })
};
