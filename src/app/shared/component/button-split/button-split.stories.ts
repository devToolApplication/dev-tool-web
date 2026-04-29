import type { Meta, StoryObj } from '@storybook/angular';
import type { MenuItem } from 'primeng/api';

import { ButtonSplit } from './button-split';

const model: MenuItem[] = [
  { label: 'Edit', icon: 'pi pi-pencil' },
  { label: 'Duplicate', icon: 'pi pi-copy' },
  { label: 'Delete', icon: 'pi pi-trash' }
];

const meta: Meta<ButtonSplit> = {
  title: 'Shared/Components/Button Split',
  component: ButtonSplit,
  args: {
    label: 'Actions',
    icon: 'pi pi-bolt',
    model
  }
};

export default meta;

type Story = StoryObj<ButtonSplit>;

export const Default: Story = {};
