import type { Meta, StoryObj } from '@storybook/angular';

import type { KeyValueItem } from '../../ui/data-display/key-value-list/key-value-list.component';
import type { TimelineItem } from '../../ui/data-display/timeline/timeline.component';
import type { ActionToolbarAction } from '../../ui/layout/action-toolbar/action-toolbar.component';

const keyValues: KeyValueItem[] = [
  { label: 'ID', value: 'job-scheduler-001', type: 'copyable' },
  { label: 'Status', value: 'Running', type: 'badge', variant: 'success' },
  { label: 'Environment', value: 'Production', type: 'badge', variant: 'info' },
  { label: 'Created', value: new Date('2026-05-10T08:00:00Z'), type: 'datetime' },
  { label: 'Last Updated', value: new Date('2026-05-27T14:00:00Z'), type: 'datetime' },
  { label: 'Owner', value: 'lamld2510@gmail.com', type: 'text' },
  { label: 'Configuration', value: { timeout: 5000, retries: 3, batchSize: 50 }, type: 'json' }
];

const timelineItems: TimelineItem[] = [
  { title: 'Deployed to production', description: 'Version 2.4.1 deployed successfully.', variant: 'success', time: '2026-05-27 14:00' },
  { title: 'Configuration updated', description: 'Timeout increased from 3000ms to 5000ms.', variant: 'info', time: '2026-05-25 10:30' },
  { title: 'Failed health check', description: 'Connection timeout to downstream service.', variant: 'danger', time: '2026-05-24 03:15' },
  { title: 'Auto-recovered', description: 'Service restarted after 2 failed attempts.', variant: 'warning', time: '2026-05-24 03:18' },
  { title: 'Created', description: 'Initial deployment from CI/CD pipeline.', variant: 'success', time: '2026-05-10 08:00' }
];

const actions: ActionToolbarAction[] = [
  { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', placement: 'primary', variant: 'primary' },
  { id: 'restart', label: 'Restart', icon: 'pi pi-refresh', placement: 'secondary', variant: 'ghost' },
  {
    id: 'delete',
    label: 'Delete',
    icon: 'pi pi-trash',
    placement: 'secondary',
    variant: 'danger',
    confirm: { title: 'Delete job', message: 'This will permanently remove the job and its history.', variant: 'danger' }
  }
];

const meta: Meta = {
  title: 'Patterns/Detail Page',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Detail page pattern: PageShell + KeyValueList + Timeline + ActionToolbar.
Used for viewing a single entity with its metadata and activity history.
Figma: map as a page-level frame with info section and timeline.
        `
      }
    }
  }
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    props: { keyValues, timelineItems, actions },
    template: `
      <app-page-shell
        title="Job Scheduler"
        subtitle="job-scheduler-001"
        [breadcrumb]="[{ label: 'Jobs', routerLink: '/jobs' }, { label: 'job-scheduler-001' }]"
        [status]="{ label: 'Running', variant: 'success', icon: 'pi pi-check-circle' }"
      >
        <app-action-toolbar page-actions [actions]="actions"></app-action-toolbar>

        <app-section-panel title="Details" subtitle="Job metadata and configuration">
          <app-key-value-list [items]="keyValues"></app-key-value-list>
        </app-section-panel>

        <app-section-panel title="Activity" subtitle="Recent events and state changes">
          <app-data-timeline [items]="timelineItems"></app-data-timeline>
        </app-section-panel>

        <app-confirm-dialog-host></app-confirm-dialog-host>
      </app-page-shell>
    `
  })
};

export const WithError: Story = {
  render: () => ({
    props: { actions },
    template: `
      <app-page-shell
        title="Job Scheduler"
        subtitle="job-scheduler-001"
        [breadcrumb]="[{ label: 'Jobs', routerLink: '/jobs' }, { label: 'job-scheduler-001' }]"
        error="Failed to load job details. The service may be unavailable."
      >
        <app-action-toolbar page-actions [actions]="actions"></app-action-toolbar>
      </app-page-shell>
    `
  })
};
