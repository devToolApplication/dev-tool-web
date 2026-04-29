import type { Meta, StoryObj } from '@storybook/angular';
import type { MenuItem } from 'primeng/api';

import { Breadcrumb } from './breadcrumb';

const items: MenuItem[] = [
  { label: 'Admin' },
  { label: 'Trade Bot' },
  { label: 'Strategy Config' }
];

const meta: Meta<Breadcrumb> = {
  title: 'Shared/Components/Breadcrumb',
  component: Breadcrumb,
  args: {
    items
  }
};

export default meta;

type Story = StoryObj<Breadcrumb>;

export const Default: Story = {};
