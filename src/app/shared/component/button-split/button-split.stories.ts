import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonSplit } from './button-split';

const sampleMenuItems = [
  { label: 'Edit Workflow', icon: 'pi pi-pencil' },
  { label: 'Delete Workflow', icon: 'pi pi-trash', severity: 'danger' }
];

const meta: Meta<ButtonSplit> = {
  title: 'Shared/Components/Form/ButtonSplit',
  component: ButtonSplit,
  args: {
    label: 'Actions',
    icon: 'pi pi-cog',
    model: sampleMenuItems,
    expandAriaLabel: 'Open actions menu'
  }
};

export default meta;

type Story = StoryObj<ButtonSplit>;

export const Default: Story = {};
