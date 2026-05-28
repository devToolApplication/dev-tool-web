import type { Meta, StoryObj } from '@storybook/angular';
import { Paginator } from './paginator';

const meta: Meta<Paginator> = {
  title: 'Shared/Components/Navigation/Paginator',
  component: Paginator,
  args: {
    first: 0,
    rows: 10,
    totalRecords: 120,
    rowsPerPageOptions: [5, 10, 20]
  }
};

export default meta;

type Story = StoryObj<Paginator>;

export const Default: Story = {};

export const CustomRows: Story = {
  args: {
    first: 20,
    rows: 20,
    totalRecords: 500,
    rowsPerPageOptions: [10, 20, 50, 100]
  }
};
