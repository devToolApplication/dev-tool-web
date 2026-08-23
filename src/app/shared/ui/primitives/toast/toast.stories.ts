import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { ToastComponent } from './toast';
import { ToastService } from '@core/notifications/toast.service';
import { I18nService } from '@core/i18n/i18n.service';

type ToastStoryWindow = Window & {
  __toastService?: ToastService;
};

type ToastStoryI18n = Pick<I18nService, 't'>;

function storyWindow(): ToastStoryWindow {
  return window as ToastStoryWindow;
}

const meta: Meta<ToastComponent> = {
  title: 'Shared/Components/Feedback/Toast',
  component: ToastComponent,
  decorators: [
    applicationConfig({
      providers: [
        ToastService,
        {
          provide: I18nService,
          useValue: { t: (key: unknown) => (typeof key === 'string' ? key : '') },
        },
      ],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <div>
        <p class="text-sm p-4 border rounded mb-4">Click buttons to trigger toast messages:</p>
        <div class="flex gap-2">
          <app-button label="Show Success" variant="primary" (buttonClick)="showSuccess()"></app-button>
          <app-button label="Show Error" variant="destructive" (buttonClick)="showError()"></app-button>
        </div>
        <app-toast></app-toast>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<ToastComponent>;

export const Default: Story = {
  render: (args) => ({
    props: {
      ...args,
      showSuccess: function () {
        const service = storyWindow().__toastService;
        if (service) service.success('Success', 'Sync process completed successfully.');
      },
      showError: function () {
        const service = storyWindow().__toastService;
        if (service) service.error('Connection Failure', 'Loss of database endpoint heartbeat.');
      },
    },
    template: `
      <div>
        <p class="text-sm p-4 border rounded mb-4">Click below to trigger toast notifications:</p>
        <div class="flex gap-2 mb-4">
          <app-button label="Show Success" variant="primary" (buttonClick)="showSuccess()"></app-button>
          <app-button label="Show Error" variant="destructive" (buttonClick)="showError()"></app-button>
        </div>
        <app-toast></app-toast>
      </div>
    `,
  }),
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: ToastService,
          useFactory: () => {
            const i18n: ToastStoryI18n = {
              t: (key: unknown) => (typeof key === 'string' ? key : ''),
            };
            const service = new ToastService(i18n as I18nService);
            storyWindow().__toastService = service;
            return service;
          },
        },
        {
          provide: I18nService,
          useValue: { t: (key: unknown) => (typeof key === 'string' ? key : '') },
        },
      ],
    }),
  ],
};
