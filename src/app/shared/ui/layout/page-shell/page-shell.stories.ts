import type { Meta, StoryObj } from '@storybook/angular';
import { PageShellComponent } from './page-shell.component';

const meta: Meta<PageShellComponent> = {
  title: 'Shared/UI/Layout/PageShell',
  component: PageShellComponent,
  args: {
    title: 'page.shell.demo.title',
    subtitle: 'page.shell.demo.subtitle',
    layout: 'default',
    loading: false,
    empty: false,
    emptyTitle: 'shared.empty.title'
  },
  render: (args) => ({
    props: args,
    template: `
      <app-page-shell
        [title]="title"
        [subtitle]="subtitle"
        [status]="status"
        [breadcrumb]="breadcrumb"
        [layout]="layout"
        [loading]="loading"
        [error]="error"
        [empty]="empty"
        [emptyTitle]="emptyTitle"
        [emptyDescription]="emptyDescription"
      >
        <div page-actions class="flex gap-2">
          <app-button label="common.save" severity="primary"></app-button>
          <app-button label="common.cancel" severity="secondary"></app-button>
        </div>
        <div page-summary class="p-4 bg-muted rounded mb-4">
          <p class="text-sm font-semibold">Summary Metric Card Row Placeholder</p>
        </div>
        <div page-toolbar class="mb-4">
          <div class="flex justify-between items-center bg-surface-card p-2 border rounded">
            <span>Toolbar actions here</span>
          </div>
        </div>
        <div class="p-6 bg-surface-card border rounded-lg">
          <h2 class="text-lg font-bold mb-2">Main Content Area</h2>
          <p>This is the main content area of the page shell component.</p>
        </div>
      </app-page-shell>
    `
  })
};

export default meta;

type Story = StoryObj<PageShellComponent>;

export const Default: Story = {};

export const WithBreadcrumb: Story = {
  args: {
    breadcrumb: [
      { label: 'nav.home', routerLink: '/' },
      { label: 'nav.settings', routerLink: '/settings' },
      { label: 'nav.profile' }
    ]
  }
};

export const WithStatus: Story = {
  args: {
    status: {
      label: 'status.active',
      variant: 'success',
      icon: 'pi pi-check-circle'
    }
  }
};

export const Loading: Story = {
  args: {
    loading: true
  }
};

export const Error: Story = {
  args: {
    error: 'Failed to load page data. Please check your network connection.'
  }
};

export const Empty: Story = {
  args: {
    empty: true,
    emptyDescription: 'No items were found in this collection.'
  }
};

export const WideLayout: Story = {
  args: {
    layout: 'wide'
  }
};

export const FullLayout: Story = {
  args: {
    layout: 'full'
  }
};
