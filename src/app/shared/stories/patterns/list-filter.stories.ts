import type { Meta, StoryObj } from '@storybook/angular';

import type { FilterPanelField } from '../../ui/layout/filter-panel/filter-panel.component';
import type { TableConfig } from '../../ui/table/models/table-config.model';

const filters: FilterPanelField[] = [
  { key: 'search', label: 'Search', type: 'text', placeholder: 'Filter by name or ID...' },
  {
    key: 'state',
    label: 'State',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Running', value: 'running' },
      { label: 'Stopped', value: 'stopped' },
      { label: 'Failed', value: 'failed' }
    ]
  },
  {
    key: 'environment',
    label: 'Environment',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Production', value: 'prod' },
      { label: 'Staging', value: 'staging' }
    ]
  },
  { key: 'showInactive', label: 'Show inactive', type: 'boolean', advanced: true }
];

const tableConfig: TableConfig = {
  rowClickable: true,
  emptyTitle: 'No jobs match your filters',
  columns: [
    { field: 'name', header: 'Job Name', type: 'text' },
    { field: 'state', header: 'State', type: 'badge', badgeMap: { running: 'success', stopped: 'muted', failed: 'danger' } },
    { field: 'environment', header: 'Env', type: 'badge', badgeMap: { prod: 'info', staging: 'warning' } },
    { field: 'lastRun', header: 'Last Run', type: 'text' },
    { field: 'duration', header: 'Duration', type: 'text' }
  ]
};

const rows = [
  { name: 'Data Sync Pipeline', state: 'running', environment: 'prod', lastRun: '2 min ago', duration: '4m 12s' },
  { name: 'Report Generator', state: 'running', environment: 'prod', lastRun: '15 min ago', duration: '1m 03s' },
  { name: 'Cache Warmer', state: 'stopped', environment: 'staging', lastRun: '2h ago', duration: '0m 45s' },
  { name: 'Email Dispatcher', state: 'failed', environment: 'prod', lastRun: '30 min ago', duration: '0m 02s' },
  { name: 'Backup Scheduler', state: 'stopped', environment: 'staging', lastRun: '1d ago', duration: '12m 30s' }
];

const meta: Meta = {
  title: 'Patterns/List + Filter',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
List with filters pattern: FilterPanel + Table + Pagination + Empty/Loading states.
A lighter variant of CRUD page without create/delete actions — used for monitoring and read-heavy views.
Figma: map as a page-level frame with filter bar and data table.
        `
      }
    }
  }
};

export default meta;

type Story = StoryObj;

export const WithData: Story = {
  render: () => ({
    props: { filters, tableConfig, rows },
    template: `
      <app-page-shell title="Job Monitor" subtitle="View running and recent jobs">
        <app-section-panel page-toolbar title="Filters" subtitle="Narrow results">
          <app-filter-panel [filters]="filters"></app-filter-panel>
        </app-section-panel>
        <app-table [config]="tableConfig" [data]="rows"></app-table>
      </app-page-shell>
    `
  })
};

export const Empty: Story = {
  render: () => ({
    props: { filters, tableConfig },
    template: `
      <app-page-shell title="Job Monitor" subtitle="View running and recent jobs">
        <app-section-panel page-toolbar title="Filters" subtitle="Narrow results">
          <app-filter-panel [filters]="filters"></app-filter-panel>
        </app-section-panel>
        <app-table [config]="tableConfig" [data]="[]"></app-table>
      </app-page-shell>
    `
  })
};

export const Loading: Story = {
  render: () => ({
    props: { filters },
    template: `
      <app-page-shell title="Job Monitor" subtitle="View running and recent jobs" [loading]="true">
        <app-section-panel page-toolbar title="Filters" subtitle="Narrow results">
          <app-filter-panel [filters]="filters"></app-filter-panel>
        </app-section-panel>
      </app-page-shell>
    `
  })
};
