import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { ConfirmDialogHostComponent } from './confirm-dialog-host.component';
import { ConfirmDialogService } from './confirm-dialog.service';
import { I18nService } from '../../../../core/ui-services/i18n.service';

const meta: Meta<ConfirmDialogHostComponent> = {
  title: 'Shared/UI/Overlay/ConfirmDialogHost',
  component: ConfirmDialogHostComponent,
  decorators: [
    applicationConfig({
      providers: [
        ConfirmDialogService,
        {
          provide: I18nService,
          useValue: {
            t: (key: string) => key
          }
        }
      ]
    })
  ],
  render: (args) => ({
    props: args,
    template: `
      <div>
        <div class="flex gap-2 mb-6">
          <app-button label="Trigger Danger Confirm" severity="danger" (buttonClick)="triggerDanger()"></app-button>
          <app-button label="Trigger Warning Confirm" severity="warn" (buttonClick)="triggerWarning()"></app-button>
          <app-button label="Trigger Required Text Confirm" severity="primary" (buttonClick)="triggerRequiredText()"></app-button>
        </div>

        <app-confirm-dialog-host></app-confirm-dialog-host>
      </div>
    `
  })
};

export default meta;

type Story = StoryObj<ConfirmDialogHostComponent>;

export const Default: Story = {
  render: (args) => ({
    props: {
      ...args,
      triggerDanger: function() {
        const service = (window as any).confirmDialogServiceInstance;
        if (service) {
          service.confirm({
            title: 'Delete Workflow?',
            message: 'Are you sure you want to permanently delete this workflow? This action cannot be undone.',
            variant: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel'
          });
        }
      },
      triggerWarning: function() {
        const service = (window as any).confirmDialogServiceInstance;
        if (service) {
          service.confirm({
            title: 'Deactivate Node?',
            message: 'Deactivating this node will pause all processing schedules.',
            variant: 'warning',
            confirmText: 'Pause Node',
            cancelText: 'Keep Active'
          });
        }
      },
      triggerRequiredText: function() {
        const service = (window as any).confirmDialogServiceInstance;
        if (service) {
          service.confirm({
            title: 'Force Purge Data?',
            message: 'Please type "PURGE" to authorize deleting all database indexes.',
            variant: 'danger',
            requireText: 'PURGE',
            confirmText: 'Purge All',
            cancelText: 'Abort'
          });
        }
      }
    },
    template: `
      <div>
        <div class="flex gap-2 mb-6 p-4 bg-muted border rounded">
          <app-button label="Danger Confirmation" severity="danger" (buttonClick)="triggerDanger()"></app-button>
          <app-button label="Warning Confirmation" severity="warn" (buttonClick)="triggerWarning()"></app-button>
          <app-button label="Required Text Confirmation" severity="primary" (buttonClick)="triggerRequiredText()"></app-button>
        </div>

        <app-confirm-dialog-host></app-confirm-dialog-host>
      </div>
    `
  }),
  decorators: [
    (storyFn, context) => {
      const story = storyFn();
      // Expose service globally so render callbacks can access it easily in this isolated Storybook environment
      const injector = (context as any).canvasElement ? null : null;
      return story;
    },
    applicationConfig({
      providers: [
        {
          provide: ConfirmDialogService,
          useFactory: (i18n: I18nService) => {
            const service = new ConfirmDialogService(i18n);
            (window as any).confirmDialogServiceInstance = service;
            return service;
          },
          deps: [I18nService]
        }
      ]
    })
  ]
};
