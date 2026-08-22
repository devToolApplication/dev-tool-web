import type { Meta, StoryObj } from '@storybook/angular';
import { ActionToolbarComponent } from './action-toolbar.component';

const meta: Meta<ActionToolbarComponent> = {
  title: 'Shared/UI/Layout/ActionToolbar',
  component: ActionToolbarComponent,
  args: {
    actions: [
      {
        id: 'create',
        label: 'common.create',
        icon: 'pi pi-plus',
        variant: 'primary',
        placement: 'primary',
      },
      {
        id: 'edit',
        label: 'common.edit',
        icon: 'pi pi-pencil',
        variant: 'secondary',
        placement: 'secondary',
      },
      {
        id: 'delete',
        label: 'common.delete',
        icon: 'pi pi-trash',
        variant: 'destructive',
        placement: 'secondary',
      },
      {
        id: 'export',
        label: 'common.export',
        icon: 'pi pi-download',
        variant: 'secondary',
        placement: 'more',
      },
    ],
  },
};

export default meta;
type Story = StoryObj<ActionToolbarComponent>;

export const Default: Story = {};
