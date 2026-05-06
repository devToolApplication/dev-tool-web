import type { Meta, StoryObj } from '@storybook/angular';

import { PanelComponent } from './panel.component';

const meta: Meta<PanelComponent> = {
  title: 'Shared/Components/Panel',
  component: PanelComponent,
  args: {
    title: 'fieldOptions',
    description: 'demo.description',
    surface: 'default'
  },
  render: (args) => ({
    props: args,
    template: `
      <app-panel [title]="title" [description]="description" [surface]="surface">
        <div class="app-text">{{ 'content' | translateContent }}</div>
      </app-panel>
    `
  })
};

export default meta;

type Story = StoryObj<PanelComponent>;

export const Default: Story = {};

export const Strong: Story = {
  args: {
    surface: 'strong'
  }
};
