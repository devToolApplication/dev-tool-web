import type { Meta, StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import { TableComponent } from './component/table/table';
import type { TableConfig } from './models/table-config.model';

const rows = [
  {
    id: 'STR-001',
    name: 'Breakout Alpha',
    owner: 'Nguyen An',
    status: 'active',
    enabled: true,
    tags: ['momentum', 'btc'],
    budget: 125000,
    createdAt: new Date(2026, 3, 20),
    risk: { maxDrawdown: '8%', leverage: '2x' }
  },
  {
    id: 'STR-002',
    name: 'Mean Reversion',
    owner: 'Tran Binh',
    status: 'draft',
    enabled: false,
    tags: ['range', 'eth'],
    budget: 85000,
    createdAt: new Date(2026, 3, 22),
    risk: { maxDrawdown: '5%', leverage: '1x' }
  },
  {
    id: 'STR-003',
    name: 'Trend Rider',
    owner: 'Le Chi',
    status: 'paused',
    enabled: true,
    tags: ['trend', 'sol'],
    budget: 150000,
    createdAt: new Date(2026, 3, 25),
    risk: { maxDrawdown: '10%', leverage: '3x' }
  }
];

const tableConfig: TableConfig = {
  title: 'Strategy Configurations',
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
    { field: 'risk', header: 'Risk', type: 'group', minWidth: '16rem' },
    {
      field: 'actions',
      header: 'Actions',
      type: 'actions',
      minWidth: '16rem',
      actions: [
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          severity: 'info',
          onClick: (rowData: { id: string }) => console.log('edit', rowData.id)
        },
        {
          label: 'Delete',
          icon: 'pi pi-trash',
          severity: 'danger',
          disabled: (rowData: { status: string }) => rowData.status === 'active',
          onClick: (rowData: { id: string }) => console.log('delete', rowData.id)
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
        <p class="m-0 text-sm text-surface-500">{{ lastEvent }}</p>
      </div>
    `
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Breakout Alpha')).toBeInTheDocument();
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
