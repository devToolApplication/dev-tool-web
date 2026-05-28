import type { Meta, StoryObj } from '@storybook/angular';
import { SelectTree } from './select-tree';
import type { TreeNodeOption } from './select-tree';

const sampleTreeData: TreeNodeOption[] = [
  {
    key: '0',
    label: 'Documents',
    data: 'Documents Folder',
    icon: 'pi pi-fw pi-inbox',
    children: [
      {
        key: '0-0',
        label: 'Work',
        data: 'Work Folder',
        icon: 'pi pi-fw pi-cog',
        children: [
          { key: '0-0-0', label: 'Expenses.doc', icon: 'pi pi-fw pi-file', data: 'Expenses Document' },
          { key: '0-0-1', label: 'Resume.doc', icon: 'pi pi-fw pi-file', data: 'Resume Document' }
        ]
      },
      {
        key: '0-1',
        label: 'Home',
        data: 'Home Folder',
        icon: 'pi pi-fw pi-home',
        children: [
          { key: '0-1-0', label: 'Invoices.txt', icon: 'pi pi-fw pi-file', data: 'Invoices Text' }
        ]
      }
    ]
  },
  {
    key: '1',
    label: 'Pictures',
    data: 'Pictures Folder',
    icon: 'pi pi-fw pi-image',
    children: [
      { key: '1-0', label: 'barcelona.jpg', icon: 'pi pi-fw pi-image', data: 'Barcelona Picture' },
      { key: '1-1', label: 'logo.png', icon: 'pi pi-fw pi-image', data: 'Logo Image' }
    ]
  }
];

const meta: Meta<SelectTree> = {
  title: 'Shared/Components/Form/SelectTree',
  component: SelectTree,
  args: {
    label: 'Category',
    options: sampleTreeData,
    selectionMode: 'single',
    filter: false,
    disabled: false
  }
};

export default meta;

type Story = StoryObj<SelectTree>;

export const Default: Story = {};

export const Multiple: Story = {
  args: {
    selectionMode: 'multiple'
  }
};

export const Checkbox: Story = {
  args: {
    selectionMode: 'checkbox'
  }
};

export const WithFilter: Story = {
  args: {
    filter: true
  }
};
