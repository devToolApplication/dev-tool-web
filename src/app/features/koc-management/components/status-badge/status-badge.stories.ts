import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { SharedModule } from '@shared/shared.module';
import { StatusBadgeComponent } from './status-badge.component';

const meta: Meta<StatusBadgeComponent> = {
  title: 'Features/KOC Management/Components/Status Badge',
  component: StatusBadgeComponent,
  decorators: [
    moduleMetadata({
      declarations: [StatusBadgeComponent],
      imports: [SharedModule],
    }),
  ],
  args: {
    status: 'ACCEPTED',
    size: 'md',
  },
  argTypes: {
    status: {
      control: 'select',
      options: [
        'ACCEPTED',
        'REJECTED',
        'REVIEW',
        'SCREENING',
        'WAITING',
        'WAITING_DEPENDENCY',
        'RUNNING',
        'HEALTHY',
        'RECOVERING',
        'BLOCKED',
        'DISABLED',
        'FOUND',
        'NOT_FOUND',
        'INSUFFICIENT',
        'FETCH_ERROR',
        'UNSUPPORTED',
        'UNKNOWN',
      ],
    },
    size: {
      control: 'radio',
      options: ['sm', 'md'],
    },
  },
};

export default meta;

type Story = StoryObj<StatusBadgeComponent>;

export const Default: Story = {};

export const CandidateStatuses: Story = {
  render: () => ({
    template: `
      <div class="flex flex-wrap gap-2">
        <app-koc-status-badge status="ACCEPTED"></app-koc-status-badge>
        <app-koc-status-badge status="REJECTED"></app-koc-status-badge>
        <app-koc-status-badge status="REVIEW"></app-koc-status-badge>
        <app-koc-status-badge status="SCREENING"></app-koc-status-badge>
        <app-koc-status-badge status="WAITING"></app-koc-status-badge>
        <app-koc-status-badge status="WAITING_DEPENDENCY"></app-koc-status-badge>
      </div>
    `,
  }),
};

export const EvidenceStates: Story = {
  render: () => ({
    template: `
      <div class="flex flex-wrap gap-2">
        <app-koc-status-badge status="FOUND"></app-koc-status-badge>
        <app-koc-status-badge status="NOT_FOUND"></app-koc-status-badge>
        <app-koc-status-badge status="INSUFFICIENT"></app-koc-status-badge>
        <app-koc-status-badge status="FETCH_ERROR"></app-koc-status-badge>
        <app-koc-status-badge status="UNSUPPORTED"></app-koc-status-badge>
      </div>
    `,
  }),
};

export const IncidentAndHealthVariants: Story = {
  render: () => ({
    template: `
      <div class="flex flex-wrap gap-2">
        <app-koc-status-badge status="HEALTHY"></app-koc-status-badge>
        <app-koc-status-badge status="RECOVERING"></app-koc-status-badge>
        <app-koc-status-badge status="BLOCKED"></app-koc-status-badge>
        <app-koc-status-badge status="DEGRADED"></app-koc-status-badge>
        <app-koc-status-badge status="DISABLED"></app-koc-status-badge>
      </div>
    `,
  }),
};

export const SmallSizeMatrix: Story = {
  render: () => ({
    template: `
      <div class="flex flex-wrap gap-2">
        <app-koc-status-badge status="ACCEPTED" size="sm"></app-koc-status-badge>
        <app-koc-status-badge status="REJECTED" size="sm"></app-koc-status-badge>
        <app-koc-status-badge status="FETCH_ERROR" size="sm"></app-koc-status-badge>
        <app-koc-status-badge status="BLOCKED" size="sm"></app-koc-status-badge>
        <app-koc-status-badge status="RECOVERING" size="sm"></app-koc-status-badge>
        <app-koc-status-badge status="HEALTHY" size="sm"></app-koc-status-badge>
      </div>
    `,
  }),
};