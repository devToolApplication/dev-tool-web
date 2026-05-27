import type { Meta, StoryObj } from '@storybook/angular';
import { TimelineComponent, type TimelineItem } from './timeline.component';

const sampleItems: TimelineItem[] = [
  {
    id: 1,
    title: 'timeline.event.created',
    description: 'The workflow definition was created and initialized.',
    time: new Date(2026, 4, 27, 9, 0, 0),
    icon: 'pi pi-plus',
    variant: 'info'
  },
  {
    id: 2,
    title: 'timeline.event.validated',
    description: 'Automatic system verification passed successfully.',
    time: new Date(2026, 4, 27, 9, 5, 0),
    icon: 'pi pi-check',
    variant: 'success'
  },
  {
    id: 3,
    title: 'timeline.event.failed',
    description: 'Deployment failed due to credential error on cluster local-01.',
    time: new Date(2026, 4, 27, 9, 10, 0),
    icon: 'pi pi-exclamation-triangle',
    variant: 'danger',
    actionLabel: 'common.retry'
  },
  {
    id: 4,
    title: 'timeline.event.completed',
    description: 'System successfully rolled back and stabilized.',
    time: new Date(2026, 4, 27, 9, 15, 0),
    icon: 'pi pi-refresh',
    variant: 'muted'
  }
];

const meta: Meta<TimelineComponent> = {
  title: 'Shared/UI/DataDisplay/Timeline',
  component: TimelineComponent,
  args: {
    items: sampleItems,
    loading: false,
    emptyTitle: 'shared.empty.title',
    timestampFormat: 'dd/MM/yyyy HH:mm:ss'
  }
};

export default meta;

type Story = StoryObj<TimelineComponent>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    loading: true
  }
};

export const ErrorState: Story = {
  args: {
    error: 'Failed to retrieve timeline events.'
  }
};

export const Empty: Story = {
  args: {
    items: []
  }
};
