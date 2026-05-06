import type { Meta, StoryObj } from '@storybook/angular';

import { PrimeTableComponent } from './prime-table.component';

interface DemoRow {
  name: string;
  status: string;
}

const rows: DemoRow[] = [
  { name: 'Alpha', status: 'active' },
  { name: 'Beta', status: 'inactive' },
  { name: 'Gamma', status: 'active' }
];

const meta: Meta<PrimeTableComponent<DemoRow>> = {
  title: 'Shared/Components/PrimeTable',
  component: PrimeTableComponent,
  args: {
    value: rows,
    loading: false,
    paginator: false,
    rows: 10
  },
  render: (args) => ({
    props: args,
    template: `
      <app-prime-table [value]="value" [loading]="loading" [paginator]="paginator" [rows]="rows">
        <ng-template pTemplate="header">
          <tr>
            <th>{{ 'name' | translateContent }}</th>
            <th>{{ 'status' | translateContent }}</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-row>
          <tr>
            <td>{{ row.name }}</td>
            <td><app-tag [value]="row.status"></app-tag></td>
          </tr>
        </ng-template>
      </app-prime-table>
    `
  })
};

export default meta;

type Story = StoryObj<PrimeTableComponent<DemoRow>>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    loading: true
  }
};

export const Paginated: Story = {
  args: {
    paginator: true,
    rows: 2
  }
};
