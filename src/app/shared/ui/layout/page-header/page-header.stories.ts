import type { Meta, StoryObj } from '@storybook/angular';
import { PageHeaderComponent } from './page-header.component';

const meta: Meta<PageHeaderComponent> = {
  title: 'Shared/UI/Layout/PageHeader',
  component: PageHeaderComponent,
  args: {
    title: 'page.header.demo.title',
    subtitle: 'page.header.demo.subtitle',
    showBack: false,
    backLabel: 'back'
  },
  render: (args) => ({
    props: args,
    template: `
      <app-page-header
        [title]="title"
        [subtitle]="subtitle"
        [breadcrumb]="breadcrumb"
        [status]="status"
        [showBack]="showBack"
        [backLabel]="backLabel"
      >
        <div page-actions class="flex gap-2">
          <app-button label="common.edit" severity="secondary" icon="pi pi-pencil"></app-button>
          <app-button label="common.delete" severity="danger" icon="pi pi-trash"></app-button>
        </div>
      </app-page-header>
    `
  })
};

export default meta;

type Story = StoryObj<PageHeaderComponent>;

export const Default: Story = {};

export const WithSubtitle: Story = {
  args: {
    subtitle: 'This is a secondary description providing more context.'
  }
};

export const WithBreadcrumb: Story = {
  args: {
    breadcrumb: [
      { label: 'nav.home', routerLink: '/' },
      { label: 'nav.users', routerLink: '/users' },
      { label: 'nav.details' }
    ]
  }
};

export const WithStatus: Story = {
  args: {
    status: {
      label: 'status.pending',
      variant: 'warning',
      icon: 'pi pi-clock'
    }
  }
};

export const WithBackButton: Story = {
  args: {
    showBack: true,
    backLabel: 'common.goBack'
  }
};

export const FullFeatured: Story = {
  args: {
    showBack: true,
    breadcrumb: [
      { label: 'nav.home', routerLink: '/' },
      { label: 'nav.projects', routerLink: '/projects' },
      { label: 'nav.overview' }
    ],
    status: {
      label: 'status.completed',
      variant: 'success',
      icon: 'pi pi-check'
    }
  }
};
