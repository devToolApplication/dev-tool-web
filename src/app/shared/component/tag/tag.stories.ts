import type { Meta, StoryObj } from '@storybook/angular';

import { Tag } from './tag';

const meta: Meta<Tag> = {
  title: 'Shared/Components/Tag',
  component: Tag,
  args: {
    value: 'active',
    severity: 'success',
    rounded: false
  }
};

export default meta;

type Story = StoryObj<Tag>;

export const Success: Story = {};

export const Warning: Story = {
  args: {
    value: 'inactive',
    severity: 'warn'
  }
};

export const Rounded: Story = {
  args: {
    rounded: true,
    icon: 'pi pi-check'
  }
};
