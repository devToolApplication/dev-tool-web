import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { ActionToolbarComponent } from './action-toolbar.component';
import { PermissionService } from '../../../../core/auth/permission.service';
import { ConfirmDialogService } from '../../overlay/confirm-dialog/confirm-dialog.service';

const meta: Meta<ActionToolbarComponent> = {
  title: 'Shared/UI/Layout/ActionToolbar',
  component: ActionToolbarComponent,
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: PermissionService,
          useValue: {
            hasAll: () => true
          }
        },
        {
          provide: ConfirmDialogService,
          useValue: {
            confirm: () => Promise.resolve(true)
          }
        }
      ]
    })
  ],
  args: {
    actions: [
      { id: 'create', label: 'common.create', icon: 'pi pi-plus', variant: 'primary', placement: 'primary' },
      { id: 'edit', label: 'common.edit', icon: 'pi pi-pencil', variant: 'default', placement: 'secondary' },
      { id: 'refresh', label: 'common.refresh', icon: 'pi pi-refresh', variant: 'ghost', placement: 'secondary' },
      { id: 'delete', label: 'common.delete', icon: 'pi pi-trash', variant: 'danger', placement: 'secondary' },
      { id: 'archive', label: 'common.archive', icon: 'pi pi-box', variant: 'default', placement: 'more' }
    ]
  }
};

export default meta;

type Story = StoryObj<ActionToolbarComponent>;

export const Default: Story = {};

export const WithVariants: Story = {
  args: {
    actions: [
      { id: 'default', label: 'Default', variant: 'default', placement: 'primary' },
      { id: 'primary', label: 'Primary', variant: 'primary', placement: 'primary' },
      { id: 'warning', label: 'Warning', variant: 'warning', placement: 'primary' },
      { id: 'danger', label: 'Danger', variant: 'danger', placement: 'primary' },
      { id: 'ghost', label: 'Ghost', variant: 'ghost', placement: 'primary' }
    ]
  }
};

export const WithDisabled: Story = {
  args: {
    actions: [
      { id: 'active', label: 'Active Action', icon: 'pi pi-play', placement: 'primary' },
      { id: 'disabled', label: 'Disabled Action', icon: 'pi pi-lock', disabled: true, placement: 'primary' }
    ]
  }
};

export const WithLoading: Story = {
  args: {
    actions: [
      { id: 'loading', label: 'Loading Action', icon: 'pi pi-spin pi-spinner', loading: true, placement: 'primary' }
    ]
  }
};

export const MixedPlacement: Story = {
  args: {
    actions: [
      { id: 'save', label: 'Save', icon: 'pi pi-save', variant: 'primary', placement: 'primary' },
      { id: 'cancel', label: 'Cancel', icon: 'pi pi-times', placement: 'secondary' },
      { id: 'export', label: 'Export to CSV', icon: 'pi pi-download', placement: 'more' },
      { id: 'print', label: 'Print Page', icon: 'pi pi-print', placement: 'more' }
    ]
  }
};
