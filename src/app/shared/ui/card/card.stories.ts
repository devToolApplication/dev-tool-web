import type { Meta, StoryObj } from '@storybook/angular';

import { CardComponent } from './card.component';

const meta: Meta<CardComponent> = {
  title: 'Shared/UI/Card',
  component: CardComponent,
  args: {
    padding: 'md',
    surface: 'default',
    interactive: false,
    fullHeight: false
  },
  render: (args) => ({
    props: args,
    template: `
      <app-card [padding]="padding" [surface]="surface" [interactive]="interactive" [fullHeight]="fullHeight">
        <div class="app-text">{{ 'content' | translateContent }}</div>
      </app-card>
    `
  })
};

export default meta;

type Story = StoryObj<CardComponent>;

export const Default: Story = {};

export const Strong: Story = {
  args: {
    surface: 'strong'
  }
};

export const Interactive: Story = {
  args: {
    interactive: true
  }
};
