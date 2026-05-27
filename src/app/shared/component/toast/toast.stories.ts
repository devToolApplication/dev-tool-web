import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { ToastComponent } from './toast';
import { MessageService } from 'primeng/api';

const meta: Meta<ToastComponent> = {
  title: 'Shared/Components/Feedback/Toast',
  component: ToastComponent,
  decorators: [
    applicationConfig({
      providers: [MessageService]
    })
  ],
  args: {
    key: 'toast-demo',
    position: 'top-right',
    life: 3000
  },
  render: (args) => ({
    props: args,
    template: `
      <div>
        <p class="text-sm p-4 bg-muted border rounded mb-4">Click buttons to trigger toast messages:</p>
        <div class="flex gap-2">
          <app-button label="Show Success" severity="success" (buttonClick)="showSuccess()"></app-button>
          <app-button label="Show Error" severity="danger" (buttonClick)="showError()"></app-button>
        </div>
        <app-toast [key]="key" [position]="position" [life]="life"></app-toast>
      </div>
    `
  })
};

export default meta;

type Story = StoryObj<ToastComponent>;

export const Default: Story = {
  render: (args) => ({
    props: {
      ...args,
      showSuccess: function() {
        const service = (window as any).messageServiceInstance;
        if (service) {
          service.add({
            key: 'toast-demo',
            severity: 'success',
            summary: 'Success',
            detail: 'Sync process completed successfully.'
          });
        }
      },
      showError: function() {
        const service = (window as any).messageServiceInstance;
        if (service) {
          service.add({
            key: 'toast-demo',
            severity: 'error',
            summary: 'Connection Failure',
            detail: 'Loss of database endpoint heartbeat.'
          });
        }
      }
    },
    template: `
      <div>
        <p class="text-sm p-4 bg-muted border rounded mb-4">Click below to trigger app-toast notification wrapper:</p>
        <div class="flex gap-2 mb-4">
          <app-button label="Show Success" severity="success" (buttonClick)="showSuccess()"></app-button>
          <app-button label="Show Error" severity="danger" (buttonClick)="showError()"></app-button>
        </div>
        <app-toast [key]="key" [position]="position" [life]="life"></app-toast>
      </div>
    `
  }),
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: MessageService,
          useFactory: () => {
            const service = new MessageService();
            (window as any).messageServiceInstance = service;
            return service;
          }
        }
      ]
    })
  ]
};
