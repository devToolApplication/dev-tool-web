import type { Meta, StoryObj } from '@storybook/angular';
import { Tag } from './tag';

const meta: Meta<Tag> = {
  title: 'Shared/Components/Display/Tag',
  component: Tag,
  args: {
    value: 'Tag Label',
    severity: null,
    rounded: false
  }
};

export default meta;

type Story = StoryObj<Tag>;

export const Default: Story = {};

export const AllSeverities: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="flex flex-wrap gap-2">
        <app-tag value="Primary"></app-tag>
        <app-tag value="Secondary" severity="secondary"></app-tag>
        <app-tag value="Success" severity="success"></app-tag>
        <app-tag value="Info" severity="info"></app-tag>
        <app-tag value="Warning" severity="warn"></app-tag>
        <app-tag value="Danger" severity="danger"></app-tag>
        <app-tag value="Contrast" severity="contrast"></app-tag>
      </div>
    `
  })
};

export const Rounded: Story = {
  args: {
    rounded: true,
    value: 'Rounded Tag',
    severity: 'info'
  }
};

export const WithIcon: Story = {
  args: {
    icon: 'pi pi-check',
    value: 'Verified',
    severity: 'success'
  }
};
