import type { Meta, StoryObj } from '@storybook/angular';

import { BaseReplayControlsComponent } from './base-replay-controls.component';

const meta: Meta<BaseReplayControlsComponent> = {
  title: 'Shared/Components/Base Replay Controls',
  component: BaseReplayControlsComponent,
  parameters: {
    layout: 'padded'
  },
  args: {
    currentStep: 2,
    totalSteps: 12,
    playing: false,
    speed: 1
  }
};

export default meta;

type Story = StoryObj<BaseReplayControlsComponent>;

export const Default: Story = {
  render: (args) => ({
    props: { ...args },
    template: `
      <div class="max-w-3xl p-4">
        <app-base-replay-controls
          [currentStep]="currentStep"
          [totalSteps]="totalSteps"
          [playing]="playing"
          [speed]="speed"
          (playingChange)="playing = $event"
          (previousStep)="currentStep = currentStep > 0 ? currentStep - 1 : 0"
          (nextStep)="currentStep = currentStep < totalSteps - 1 ? currentStep + 1 : currentStep"
          (rewind)="currentStep = 0"
          (fastForward)="currentStep = totalSteps - 1"
          (seek)="currentStep = $event"
          (speedChange)="speed = $event"
        ></app-base-replay-controls>
      </div>
    `
  })
};
