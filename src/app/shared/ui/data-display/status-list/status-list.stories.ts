import type { Meta, StoryObj } from '@storybook/angular';
import { StatusListComponent, type StatusListItem } from './status-list.component';

const sampleItems: StatusListItem[] = [
  {
    title: 'status.list.item.database',
    description: 'Main PostgreSQL database cluster connection pool status.',
    status: 'status.healthy',
    statusVariant: 'success',
    value: '98% uptime'
  },
  {
    title: 'status.list.item.api',
    description: 'External payment gateway gateway API endpoints.',
    status: 'status.slow',
    statusVariant: 'warning',
    timestamp: new Date().toISOString(),
    value: '1.2s avg response'
  },
  {
    title: 'status.list.item.auth',
    description: 'OAuth2 authorization identity and token validation server.',
    status: 'status.offline',
    statusVariant: 'danger',
    value: 'ERR_TIMEOUT'
  },
  {
    title: 'status.list.item.cache',
    description: 'Redis session state and data indexing cache.',
    status: 'status.inactive',
    statusVariant: 'muted'
  }
];

const meta: Meta<StatusListComponent> = {
  title: 'Shared/UI/DataDisplay/StatusList',
  component: StatusListComponent,
  args: {
    items: sampleItems,
    density: 'compact'
  }
};

export default meta;

type Story = StoryObj<StatusListComponent>;

export const Default: Story = {};

export const ComfortableDensity: Story = {
  args: {
    density: 'comfortable'
  }
};
