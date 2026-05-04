import type { Meta, StoryObj } from '@storybook/angular';

import { TimelineComponent } from './timeline.component';

const value = [
  { time: '09:30', title: 'Signal created', detail: 'Entry condition matched.' },
  { time: '10:15', title: 'Order filled', detail: 'Position opened at 42,100.' },
  { time: '11:45', title: 'Risk updated', detail: 'Stop loss moved to break even.' }
];

const meta: Meta<TimelineComponent> = {
  title: 'Shared/Components/Timeline',
  component: TimelineComponent,
  parameters: {
    layout: 'padded'
  },
  args: {
    value,
    align: 'left',
    layout: 'vertical'
  }
};

export default meta;

type Story = StoryObj<TimelineComponent>;

export const Default: Story = {
  render: (args) => ({
    props: { ...args },
    template: `
      <div class="max-w-3xl p-4">
        <ng-template #opposite let-item>
          <span class="text-sm app-text-muted">{{ item.time }}</span>
        </ng-template>
        <ng-template #marker let-item>
          <span class="flex h-8 w-8 items-center justify-center rounded-full app-bg-primary app-text-overlay">
            <i class="pi pi-check text-xs"></i>
          </span>
        </ng-template>
        <ng-template #content let-item>
          <div class="pb-4">
            <div class="font-semibold">{{ item.title }}</div>
            <p class="m-0 mt-1 text-sm app-text-muted">{{ item.detail }}</p>
          </div>
        </ng-template>

        <app-timeline
          [value]="value"
          [align]="align"
          [layout]="layout"
          [oppositeTemplate]="opposite"
          [markerTemplate]="marker"
          [contentTemplate]="content"
        ></app-timeline>
      </div>
    `
  })
};
