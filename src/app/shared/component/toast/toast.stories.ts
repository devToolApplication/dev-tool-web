import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { ToastComponent } from './toast';
import { ToastService } from '../../../core/ui-services/toast.service';
import { I18nService } from '../../../core/ui-services/i18n.service';

const meta: Meta<ToastComponent> = {
  title: 'Shared/Components/Feedback/Toast',
  component: ToastComponent,
  decorators: [
    applicationConfig({
      providers: [
        ToastService,
        { provide: I18nService, useValue: { t: (key: unknown) => (typeof key === 'string' ? key : '') } }
      ]
    })
  ],
  render: (args) => ({
    props: args,
    template: `
      <div>
        <p class="text-sm p-4 border rounded mb-4">Click buttons to trigger toast messages:</p>
        <div class="flex gap-2">
          <app-button label="Show Success" severity="success" (buttonClick)="showSuccess()"></app-button>
          <app-button label="Show Error" severity="danger" (buttonClick)="showError()"></app-button>
        </div>
        <app-toast></app-toast>
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
        const service = (window as any).__toastService;
        if (service) service.success('Success', 'Sync process completed successfully.');
      },
      showError: function() {
        const service = (window as any).__toastService;
        if (service) service.error('Connection Failure', 'Loss of database endpoint heartbeat.');
      }
    },
    template: `
      <div>
        <p class="text-sm p-4 border rounded mb-4">Click below to trigger toast notifications:</p>
        <div class="flex gap-2 mb-4">
          <app-button label="Show Success" severity="success" (buttonClick)="showSuccess()"></app-button>
          <app-button label="Show Error" severity="danger" (buttonClick)="showError()"></app-button>
        </div>
        <app-toast></app-toast>
      </div>
    `
  }),
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: ToastService,
          useFactory: () => {
            const i18n = { t: (key: unknown) => (typeof key === 'string' ? key : '') };
            const service = new ToastService(i18n as any);
            (window as any).__toastService = service;
            return service;
          }
        },
        { provide: I18nService, useValue: { t: (key: unknown) => (typeof key === 'string' ? key : '') } }
      ]
    })
  ]
};
