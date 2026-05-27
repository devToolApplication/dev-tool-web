import type { Meta, StoryObj } from '@storybook/angular';
import { DrawerComponent } from './drawer.component';

const meta: Meta<DrawerComponent> = {
  title: 'Shared/UI/Overlay/Drawer',
  component: DrawerComponent,
  args: {
    open: true,
    title: 'Drawer Title',
    subtitle: 'This is a drawer providing configuration options',
    size: 'md',
    side: 'right',
    closeOnBackdrop: true,
    closeOnEsc: true,
    loading: false,
    empty: false
  },
  render: (args) => ({
    props: args,
    template: `
      <div>
        <p class="text-sm p-4 bg-muted border rounded">Note: Drawer has "open: true" by default to be visible in Storybook. You can toggle the control to open/close.</p>
        <app-drawer
          [open]="open"
          [title]="title"
          [subtitle]="subtitle"
          [size]="size"
          [side]="side"
          [closeOnBackdrop]="closeOnBackdrop"
          [closeOnEsc]="closeOnEsc"
          [loading]="loading"
          [error]="error"
          [empty]="empty"
          [emptyTitle]="emptyTitle"
          [emptyDescription]="emptyDescription"
        >
          <div class="p-4">
            <h3 class="font-bold mb-2">Drawer Content Area</h3>
            <p class="mb-4">This content is projected into the default slot of the drawer.</p>
            <app-input-text label="Settings Field" placeholder="Enter configuration value" class="mb-4 block"></app-input-text>
          </div>
          <div drawer-footer class="flex justify-end gap-2 p-4 border-t">
            <app-button label="common.cancel" severity="secondary"></app-button>
            <app-button label="common.save" severity="primary"></app-button>
          </div>
        </app-drawer>
      </div>
    `
  })
};

export default meta;

type Story = StoryObj<DrawerComponent>;

export const Default: Story = {};

export const LeftSide: Story = {
  args: {
    side: 'left'
  }
};

export const LargeSize: Story = {
  args: {
    size: 'lg'
  }
};

export const Loading: Story = {
  args: {
    loading: true
  }
};

export const ErrorState: Story = {
  args: {
    error: 'Failed to retrieve drawer options.'
  }
};

export const Empty: Story = {
  args: {
    empty: true,
    emptyDescription: 'No drawer metadata to show.'
  }
};
