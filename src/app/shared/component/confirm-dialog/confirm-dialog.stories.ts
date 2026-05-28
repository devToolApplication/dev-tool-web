import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { PrimeConfirmDialogComponent } from './confirm-dialog';

const meta: Meta<PrimeConfirmDialogComponent> = {
  title: 'Shared/Components/Overlay/ConfirmDialog',
  component: PrimeConfirmDialogComponent,
  decorators: [
    applicationConfig({
      providers: [ConfirmationService]
    })
  ],
  args: {
    key: 'confirm-dialog-demo',
    header: 'Confirmation Dialog Title',
    message: 'Are you sure you want to perform this action?',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Yes, proceed',
    rejectLabel: 'No, cancel',
    closable: true
  },
  render: (args) => ({
    props: args,
    template: `
      <div>
        <p class="text-sm p-4 bg-muted border rounded mb-4">Note: This is a wrapper around PrimeNG ConfirmDialog. Click the button to trigger.</p>
        <app-button label="Trigger Confirmation" (buttonClick)="trigger()"></app-button>
        <app-confirm-dialog
          [key]="key"
          [header]="header"
          [message]="message"
          [icon]="icon"
          [acceptLabel]="acceptLabel"
          [rejectLabel]="rejectLabel"
          [closable]="closable"
          [closeOnEscape]="closeOnEscape"
          [dismissableMask]="dismissableMask"
        ></app-confirm-dialog>
      </div>
    `
  })
};

export default meta;

type Story = StoryObj<PrimeConfirmDialogComponent>;

export const Default: Story = {
  render: (args) => ({
    props: {
      ...args,
      trigger: function() {
        const service = (window as any).confirmationServiceInstance;
        if (service) {
          service.confirm({
            key: 'confirm-dialog-demo',
            message: 'Are you sure you want to proceed?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle'
          });
        }
      }
    },
    template: `
      <div>
        <p class="text-sm p-4 bg-muted border rounded mb-4">Click below to trigger PrimeNG ConfirmDialog wrapper:</p>
        <app-button label="Trigger Confirmation" (buttonClick)="trigger()"></app-button>
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
  }),
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: ConfirmationService,
          useFactory: () => {
            const service = new ConfirmationService();
            (window as any).confirmationServiceInstance = service;
            return service;
          }
        }
      ]
    })
  ]
};
