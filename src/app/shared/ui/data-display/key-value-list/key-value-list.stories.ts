import type { Meta, StoryObj } from '@storybook/angular';
import { KeyValueListComponent, type KeyValueItem } from './key-value-list.component';

const sampleItems: KeyValueItem[] = [
  { label: 'Item ID', value: 'item-10293', type: 'copyable' },
  { label: 'Name', value: 'Production Web App Server', type: 'text' },
  { label: 'CPU Usage', value: 87.5, type: 'percent', suffix: '%' },
  { label: 'Status', value: 'online', type: 'badge', variant: 'success' },
  { label: 'Created At', value: new Date(2026, 4, 12, 14, 30), type: 'datetime' },
  { label: 'Cost Per Month', value: 450.00, type: 'currency', currencyCode: 'USD' },
  { label: 'Is Managed', value: true, type: 'boolean' },
  { label: 'Extra Info', value: null, type: 'text', emptyValue: 'N/A' },
  {
    label: 'Config details',
    value: { ip: '192.168.1.1', OS: 'Ubuntu 24.04 LTS', cores: 8 },
    type: 'json'
  }
];

const meta: Meta<KeyValueListComponent> = {
  title: 'Shared/UI/DataDisplay/KeyValueList',
  component: KeyValueListComponent,
  args: {
    items: sampleItems,
    layout: 'two-column',
    emptyValue: '-'
  }
};

export default meta;

type Story = StoryObj<KeyValueListComponent>;

export const Default: Story = {};

export const OneColumn: Story = {
  args: {
    layout: 'one-column'
  }
};
