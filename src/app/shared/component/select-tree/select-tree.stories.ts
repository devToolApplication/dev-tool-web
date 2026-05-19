import type { Meta, StoryObj } from '@storybook/angular';
import type { TreeNode } from 'primeng/api';

import { SelectTree } from './select-tree';

const options: TreeNode[] = [
  {
    key: 'admin',
    label: 'Admin',
    children: [
      { key: 'admin.users', label: 'Users' },
      { key: 'admin.roles', label: 'Roles' }
    ]
  },
  {
    key: 'workflow',
    label: 'Workflows',
    children: [
      { key: 'workflow.config', label: 'Configuration' },
      { key: 'workflow.history', label: 'History' }
    ]
  }
];

const meta: Meta<SelectTree> = {
  title: 'Shared/Components/Form Controls/Select Tree',
  component: SelectTree,
  args: {
    label: 'Feature',
    placeholder: 'Select feature',
    options,
    filter: true,
    selectionMode: 'single'
  }
};

export default meta;

type Story = StoryObj<SelectTree>;

export const Single: Story = {};

export const Checkbox: Story = {
  args: {
    selectionMode: 'checkbox',
    value: ['admin.users', 'workflow.config']
  }
};
