import type { Meta, StoryObj } from '@storybook/angular';
import { Select } from './select';

const sampleOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Draft', value: 'draft', disabled: true }
];

const sampleGroupedOptions = [
  {
    label: 'Deployment States',
    items: [
      { label: 'Running', value: 'running' },
      { label: 'Pending', value: 'pending' }
    ]
  },
  {
    label: 'Terminal States',
    items: [
      { label: 'Succeeded', value: 'succeeded' },
      { label: 'Failed', value: 'failed' }
    ]
  }
];

const meta: Meta<Select> = {
  title: 'Shared/Components/Form/Select',
  component: Select,
  args: {
    label: 'Status',
    placeholder: 'Choose status',
    options: sampleOptions,
    group: false,
    loading: false,
    showClear: false,
    disabled: false
  }
};

export default meta;

type Story = StoryObj<Select>;

export const Default: Story = {};

export const WithClear: Story = {
  args: {
    showClear: true,
    value: 'active'
  }
};

export const Grouped: Story = {
  args: {
    group: true,
    options: sampleGroupedOptions,
    placeholder: 'Choose state'
  }
};

export const Loading: Story = {
  args: {
    loading: true
  }
};

export const VariantMatrix: Story = {
  render: () => ({
    props: {
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Draft', value: 'draft', disabled: true }
      ],
      groupedOptions: [
        {
          label: 'Deployment States',
          items: [
            { label: 'Running', value: 'running' },
            { label: 'Pending', value: 'pending' }
          ]
        },
        {
          label: 'Terminal States',
          items: [
            { label: 'Succeeded', value: 'succeeded' },
            { label: 'Failed', value: 'failed' }
          ]
        }
      ]
    },
    template: `
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4">Select Variant Matrix (Figma reference)</h3>
        <table style="border-collapse:collapse;width:100%">
          <thead>
            <tr>
              <th class="text-xs p-2 text-left" style="border-bottom:1px solid var(--p-surface-300)">State</th>
              <th class="text-xs p-2 text-left" style="border-bottom:1px solid var(--p-surface-300)">Flat</th>
              <th class="text-xs p-2 text-left" style="border-bottom:1px solid var(--p-surface-300)">Grouped</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-xs p-2 font-medium">Default</td>
              <td class="p-2"><app-select label="Status" placeholder="Choose" [options]="options"></app-select></td>
              <td class="p-2"><app-select label="Status" placeholder="Choose" [options]="groupedOptions" [group]="true"></app-select></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">With Value</td>
              <td class="p-2"><app-select label="Status" [options]="options" value="active"></app-select></td>
              <td class="p-2"><app-select label="Status" [options]="groupedOptions" [group]="true" value="running"></app-select></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">Clearable</td>
              <td class="p-2"><app-select label="Status" [options]="options" value="active" [showClear]="true"></app-select></td>
              <td class="p-2"><app-select label="Status" [options]="groupedOptions" [group]="true" value="running" [showClear]="true"></app-select></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">Loading</td>
              <td class="p-2"><app-select label="Status" [options]="options" [loading]="true"></app-select></td>
              <td class="p-2"><app-select label="Status" [options]="groupedOptions" [group]="true" [loading]="true"></app-select></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">Disabled</td>
              <td class="p-2"><app-select label="Status" [options]="options" value="active" [disabled]="true"></app-select></td>
              <td class="p-2"><app-select label="Status" [options]="groupedOptions" [group]="true" value="running" [disabled]="true"></app-select></td>
            </tr>
          </tbody>
        </table>
      </div>
    `
  })
};
