import type { Meta, StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { TableComponent } from './component/table/table';
import type { TableConfig } from './models/table-config.model';

const rows = [
  {
    id: 'CFG-001',
    name: 'Approval Flow',
    owner: 'Nguyen An',
    status: 'active',
    enabled: true,
    tags: ['approval', 'email'],
    budget: 125000,
    createdAt: new Date(2026, 3, 20),
    details: { priority: 'high', retries: 2 }
  },
  {
    id: 'CFG-002',
    name: 'Billing Sync',
    owner: 'Tran Binh',
    status: 'draft',
    enabled: false,
    tags: ['billing', 'sync'],
    budget: 85000,
    createdAt: new Date(2026, 3, 22),
    details: { priority: 'medium', retries: 1 }
  },
  {
    id: 'CFG-003',
    name: 'Archive Job',
    owner: 'Le Chi',
    status: 'paused',
    enabled: true,
    tags: ['archive', 'batch'],
    budget: 150000,
    createdAt: new Date(2026, 3, 25),
    details: { priority: 'low', retries: 3 }
  }
];

const tableConfig: TableConfig = {
  title: 'Workflow Configurations',
  stateKey: 'storybook-workflow-configurations',
  emptyFilteredTitle: 'No workflows match the filters',
  emptyFilteredDescription: 'Change the keyword or clear the active filters.',
  rows: 5,
  rowsPerPageOptions: [5, 10, 20],
  scrollHeight: '32rem',
  minWidth: '80rem',
  toolbar: {
    new: {
      visible: true,
      label: 'New',
      icon: 'pi pi-plus',
      severity: 'success'
    },
    delete: {
      visible: true,
      label: 'Delete',
      icon: 'pi pi-trash',
      severity: 'danger',
      disabled: true
    },
    export: {
      visible: true,
      label: 'Export',
      icon: 'pi pi-download',
      severity: 'help'
    }
  },
  filterOptions: {
    primaryField: 'name',
    enableUrlSync: false,
    drawerTitle: 'Advanced Filters'
  },
  filters: [
    {
      field: 'name',
      label: 'Name',
      placeholder: 'Search by name',
      type: 'text'
    },
    {
      field: 'status',
      label: 'Status',
      placeholder: 'Status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' }
      ]
    },
    {
      field: 'enabled',
      label: 'Enabled',
      type: 'boolean'
    },
    {
      field: 'createdAt',
      label: 'Created at',
      type: 'date-range'
    }
  ],
  columns: [
    { field: 'id', header: 'ID', sortable: true, width: '9rem' },
    { field: 'name', header: 'Name', sortable: true, minWidth: '14rem' },
    { field: 'owner', header: 'Owner', minWidth: '12rem' },
    { field: 'status', header: 'Status', minWidth: '9rem' },
    { field: 'enabled', header: 'Enabled', type: 'boolean', width: '8rem' },
    { field: 'tags', header: 'Tags', type: 'array', minWidth: '14rem' },
    {
      field: 'budget',
      header: 'Budget',
      type: 'currency',
      currencyCode: 'USD',
      minWidth: '11rem'
    },
    { field: 'createdAt', header: 'Created', type: 'date', minWidth: '10rem' },
    { field: 'details', header: 'Details', type: 'group', minWidth: '16rem' },
    {
      field: 'actions',
      header: 'Actions',
      type: 'actions',
      minWidth: '16rem',
      frozen: true,
      alignFrozen: 'right',
      actions: [
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          severity: 'info',
          onClick: (rowData: { id: string }) => void rowData.id
        },
        {
          label: 'Delete',
          icon: 'pi pi-trash',
          severity: 'danger',
          disabled: (rowData: { status: string }) => rowData.status === 'active',
          onClick: (rowData: { id: string }) => void rowData.id
        }
      ]
    }
  ]
};

const meta: Meta<TableComponent> = {
  title: 'Shared/UI/Table',
  component: TableComponent,
  parameters: {
    layout: 'padded'
  }
};

export default meta;

type Story = StoryObj<TableComponent>;

export const Default: Story = {
  args: {
    config: tableConfig,
    data: rows,
    rows: 5
  },
  render: (args) => ({
    props: {
      ...args,
      lastEvent: 'Search and toolbar events will appear here',
      format: (value: unknown) => JSON.stringify(value)
    },
    template: `
      <div class="flex flex-col gap-4 p-4">
        <app-table
          [config]="config"
          [data]="data"
          [rows]="rows"
          [loading]="loading"
          [currentPage]="currentPage"
          [totalRecords]="totalRecords"
          (search)="lastEvent = 'Search: ' + format($event)"
          (resetFilter)="lastEvent = 'Filters reset'"
          (create)="lastEvent = 'Create clicked'"
          (delete)="lastEvent = 'Delete clicked'"
          (export)="lastEvent = 'Export clicked'"
          (pageChange)="lastEvent = 'Page: ' + format($event)"
        ></app-table>
        <p class="m-0 text-sm app-text-muted">{{ lastEvent }}</p>
      </div>
    `
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Approval Flow')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: /new/i }));
    await expect(canvas.getByText('Create clicked')).toBeInTheDocument();
  }
};

export const Loading: Story = {
  args: {
    config: tableConfig,
    data: rows,
    rows: 5,
    loading: true
  },
  render: Default.render
};

export const Empty: Story = {
  args: {
    config: tableConfig,
    data: [],
    rows: 5
  },
  render: Default.render
};

export const Error: Story = {
  args: {
    config: tableConfig,
    data: [],
    rows: 5,
    error: 'loadError'
  },
  render: Default.render
};

export const SelectionAndControls: Story = {
  args: {
    config: {
      ...tableConfig,
      selection: { mode: 'multiple' },
      toolbar: {
        ...tableConfig.toolbar,
        refresh: { visible: true, label: 'refresh', icon: 'pi pi-refresh' },
        columnVisibility: { visible: true, placeholder: 'fieldOptions' },
        density: { visible: true },
        bulkActions: [
          {
            id: 'archive',
            label: 'Archive',
            icon: 'pi pi-folder',
            onClick: (selectedRows: unknown[]) => void selectedRows.length
          },
          {
            id: 'delete',
            label: 'Delete',
            icon: 'pi pi-trash',
            variant: 'danger',
            onClick: (selectedRows: unknown[]) => void selectedRows.length
          }
        ]
      }
    },
    data: rows,
    rows: 5
  },
  render: Default.render
};
