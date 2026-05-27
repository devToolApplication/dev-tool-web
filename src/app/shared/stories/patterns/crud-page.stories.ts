import type { Meta, StoryObj } from '@storybook/angular';

import type { FilterPanelField } from '../../ui/layout/filter-panel/filter-panel.component';
import type { ActionToolbarAction } from '../../ui/layout/action-toolbar/action-toolbar.component';
import type { TableConfig } from '../../ui/table/models/table-config.model';

const filters: FilterPanelField[] = [
  { key: 'keyword', label: 'Keyword', type: 'text', placeholder: 'Search by name...' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Paused', value: 'paused' },
      { label: 'Draft', value: 'draft' }
    ]
  },
  { key: 'archived', label: 'Show archived', type: 'boolean', advanced: true }
];

const actions: ActionToolbarAction[] = [
  { id: 'create', label: 'Create', icon: 'pi pi-plus', placement: 'primary', variant: 'primary' },
  { id: 'refresh', label: 'Refresh', icon: 'pi pi-refresh', placement: 'secondary', variant: 'ghost' },
  {
    id: 'delete',
    label: 'Delete',
    icon: 'pi pi-trash',
    placement: 'secondary',
    variant: 'danger',
    confirm: { message: 'Delete selected items?', variant: 'danger' }
  }
];

const tableConfig: TableConfig = {
  rowClickable: true,
  emptyTitle: 'No configurations found',
  columns: [
    { field: 'name', header: 'Name', type: 'text' },
    { field: 'status', header: 'Status', type: 'badge', badgeMap: { active: 'success', paused: 'warning', draft: 'muted' } },
    { field: 'updatedAt', header: 'Updated', type: 'text' },
    {
      field: 'actions',
      header: '',
      type: 'actions',
      actions: [
        { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', variant: 'ghost', onClick: () => undefined },
        {
          id: 'delete',
          label: 'Delete',
          icon: 'pi pi-trash',
          variant: 'danger',
          confirm: { message: 'Delete this item?', variant: 'danger' },
          onClick: () => undefined
        }
      ]
    }
  ]
};

const rows = [
  { name: 'Production Config', status: 'active', updatedAt: '2026-05-20 14:30' },
  { name: 'Staging Config', status: 'paused', updatedAt: '2026-05-18 09:15' },
  { name: 'Dev Config', status: 'draft', updatedAt: '2026-05-15 11:00' }
];

const meta: Meta = {
  title: 'Patterns/CRUD Page',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Full CRUD page pattern: PageShell + ActionToolbar + FilterPanel + Table + ConfirmDialog.
This is the standard admin list page layout used across the application.
Figma: map this composition as a page-level frame.
        `
      }
    }
  }
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    props: { filters, actions, tableConfig, rows },
    template: `
      <app-page-shell title="Configurations" subtitle="Manage system configurations">
        <app-action-toolbar page-actions [actions]="actions"></app-action-toolbar>
        <app-section-panel page-toolbar title="Filters">
          <app-filter-panel [filters]="filters"></app-filter-panel>
        </app-section-panel>
        <app-table [config]="tableConfig" [data]="rows"></app-table>
        <app-confirm-dialog-host></app-confirm-dialog-host>
      </app-page-shell>
    `
  })
};

export const EmptyState: Story = {
  render: () => ({
    props: { filters, actions, tableConfig },
    template: `
      <app-page-shell title="Configurations" subtitle="Manage system configurations">
        <app-action-toolbar page-actions [actions]="actions"></app-action-toolbar>
        <app-section-panel page-toolbar title="Filters">
          <app-filter-panel [filters]="filters"></app-filter-panel>
        </app-section-panel>
        <app-table [config]="tableConfig" [data]="[]"></app-table>
      </app-page-shell>
    `
  })
};

export const LoadingState: Story = {
  render: () => ({
    props: { filters, actions },
    template: `
      <app-page-shell title="Configurations" subtitle="Manage system configurations" [loading]="true">
        <app-action-toolbar page-actions [actions]="actions"></app-action-toolbar>
        <app-section-panel page-toolbar title="Filters">
          <app-filter-panel [filters]="filters"></app-filter-panel>
        </app-section-panel>
      </app-page-shell>
    `
  })
};
