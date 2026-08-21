import type { Meta, StoryObj } from '@storybook/angular';
import { PrimeBadgeComponent } from './prime-badge';

const meta: Meta<PrimeBadgeComponent> = {
  title: 'Shared/Components/Display/PrimeBadge',
  component: PrimeBadgeComponent,
  args: {
    value: '5',
    badgeDisabled: false
  }
};

export default meta;

type Story = StoryObj<PrimeBadgeComponent>;

export const Default: Story = {};

export const Severities: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="flex gap-2">
        <app-prime-badge value="1"></app-prime-badge>
        <app-prime-badge value="2" severity="success"></app-prime-badge>
        <app-prime-badge value="3" severity="info"></app-prime-badge>
        <app-prime-badge value="4" severity="warn"></app-prime-badge>
        <app-prime-badge value="5" severity="danger"></app-prime-badge>
        <app-prime-badge value="6" severity="secondary"></app-prime-badge>
        <app-prime-badge value="7" severity="contrast"></app-prime-badge>
      </div>
    `
  })
};

export const LargeSize: Story = {
  args: {
    size: 'large',
    value: '99+'
  }
};
