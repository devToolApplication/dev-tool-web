import type { Meta, StoryObj } from '@storybook/angular';
import { BadgeComponent } from './badge.component';

const meta: Meta<BadgeComponent> = {
  title: 'Shared/UI/DataDisplay/Badge',
  component: BadgeComponent,
  args: {
    label: 'status.active',
    variant: 'default',
    size: 'md',
    pulse: false
  }
};

export default meta;

type Story = StoryObj<BadgeComponent>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="flex flex-wrap gap-2">
        <app-badge label="Default" variant="default"></app-badge>
        <app-badge label="Info" variant="info"></app-badge>
        <app-badge label="Success" variant="success"></app-badge>
        <app-badge label="Warning" variant="warning"></app-badge>
        <app-badge label="Danger" variant="danger"></app-badge>
        <app-badge label="Muted" variant="muted"></app-badge>
      </div>
    `
  })
};

export const WithIcon: Story = {
  args: {
    label: 'status.pending',
    variant: 'warning',
    icon: 'pi pi-clock'
  }
};

export const SmallSize: Story = {
  args: {
    label: 'status.new',
    variant: 'info',
    size: 'sm'
  }
};

export const Pulsing: Story = {
  args: {
    label: 'status.online',
    variant: 'success',
    pulse: true
  }
};

export const WithTooltip: Story = {
  args: {
    label: 'status.locked',
    variant: 'danger',
    icon: 'pi pi-lock',
    tooltip: 'This item is locked'
  }
};

export const SizeVariantMatrix: Story = {
  render: () => ({
    template: `
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4">Badge Size × Variant Matrix (Figma reference)</h3>
        <table style="border-collapse:collapse;width:100%">
          <thead>
            <tr>
              <th class="text-xs p-2 text-left" style="border-bottom:1px solid var(--p-surface-300)">Variant</th>
              <th class="text-xs p-2 text-center" style="border-bottom:1px solid var(--p-surface-300)">Small</th>
              <th class="text-xs p-2 text-center" style="border-bottom:1px solid var(--p-surface-300)">Medium</th>
              <th class="text-xs p-2 text-center" style="border-bottom:1px solid var(--p-surface-300)">With Icon</th>
              <th class="text-xs p-2 text-center" style="border-bottom:1px solid var(--p-surface-300)">Pulsing</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-xs p-2 font-medium">Default</td>
              <td class="p-2 text-center"><app-badge label="Label" variant="default" size="sm"></app-badge></td>
              <td class="p-2 text-center"><app-badge label="Label" variant="default" size="md"></app-badge></td>
              <td class="p-2 text-center"><app-badge label="Label" variant="default" icon="pi pi-tag"></app-badge></td>
              <td class="p-2 text-center"><app-badge label="Label" variant="default" [pulse]="true"></app-badge></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">Info</td>
              <td class="p-2 text-center"><app-badge label="Info" variant="info" size="sm"></app-badge></td>
              <td class="p-2 text-center"><app-badge label="Info" variant="info" size="md"></app-badge></td>
              <td class="p-2 text-center"><app-badge label="Info" variant="info" icon="pi pi-info-circle"></app-badge></td>
              <td class="p-2 text-center"><app-badge label="Info" variant="info" [pulse]="true"></app-badge></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">Success</td>
              <td class="p-2 text-center"><app-badge label="Active" variant="success" size="sm"></app-badge></td>
              <td class="p-2 text-center"><app-badge label="Active" variant="success" size="md"></app-badge></td>
              <td class="p-2 text-center"><app-badge label="Active" variant="success" icon="pi pi-check-circle"></app-badge></td>
              <td class="p-2 text-center"><app-badge label="Active" variant="success" [pulse]="true"></app-badge></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">Warning</td>
              <td class="p-2 text-center"><app-badge label="Pending" variant="warning" size="sm"></app-badge></td>
              <td class="p-2 text-center"><app-badge label="Pending" variant="warning" size="md"></app-badge></td>
              <td class="p-2 text-center"><app-badge label="Pending" variant="warning" icon="pi pi-clock"></app-badge></td>
              <td class="p-2 text-center"><app-badge label="Pending" variant="warning" [pulse]="true"></app-badge></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">Danger</td>
              <td class="p-2 text-center"><app-badge label="Failed" variant="danger" size="sm"></app-badge></td>
              <td class="p-2 text-center"><app-badge label="Failed" variant="danger" size="md"></app-badge></td>
              <td class="p-2 text-center"><app-badge label="Failed" variant="danger" icon="pi pi-times-circle"></app-badge></td>
              <td class="p-2 text-center"><app-badge label="Failed" variant="danger" [pulse]="true"></app-badge></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">Muted</td>
              <td class="p-2 text-center"><app-badge label="Archived" variant="muted" size="sm"></app-badge></td>
              <td class="p-2 text-center"><app-badge label="Archived" variant="muted" size="md"></app-badge></td>
              <td class="p-2 text-center"><app-badge label="Archived" variant="muted" icon="pi pi-ban"></app-badge></td>
              <td class="p-2 text-center"><app-badge label="Archived" variant="muted" [pulse]="true"></app-badge></td>
            </tr>
          </tbody>
        </table>
      </div>
    `
  })
};
