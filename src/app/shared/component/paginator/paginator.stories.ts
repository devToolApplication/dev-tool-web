import type { Meta, StoryObj } from '@storybook/angular';

import { Paginator } from './paginator';

const meta: Meta<Paginator> = {
  title: 'Shared/Components/Paginator',
  component: Paginator,
  args: {
    first: 0,
    rows: 10,
    totalRecords: 120,
    rowsPerPageOptions: [5, 10, 20, 50]
  }
};

export default meta;

type Story = StoryObj<Paginator>;

export const Default: Story = {
  render: (args) => ({
    props: { ...args },
    template: `
      <app-paginator
        [first]="first"
        [rows]="rows"
        [totalRecords]="totalRecords"
        [rowsPerPageOptions]="rowsPerPageOptions"
        (pageChange)="first = $event.first; rows = $event.rows"
      ></app-paginator>
    `
  })
};
