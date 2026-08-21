import type { Meta, StoryObj } from '@storybook/angular';
import type { AppMenuItem } from '../button-split/button-split';

import { Breadcrumb } from './breadcrumb';

const items: AppMenuItem[] = [
  { label: 'Admin' },
  { label: 'Workflows' },
  { label: 'Configuration' }
];

const meta: Meta<Breadcrumb> = {
  title: 'Shared/Components/Navigation/Breadcrumb',
  component: Breadcrumb,
  args: {
    items
  }
};

export default meta;

type Story = StoryObj<Breadcrumb>;

export const Default: Story = {};
