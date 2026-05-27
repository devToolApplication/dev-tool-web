import type { Meta, StoryObj } from '@storybook/angular';
import { Button } from './button';

const meta: Meta<Button> = {
  title: 'Shared/Components/Form/Button',
  component: Button,
  args: {
    label: 'common.submit',
    type: 'button',
    text: false,
    loading: false,
    disabled: false,
    severity: null
  }
};

export default meta;

type Story = StoryObj<Button>;

export const Default: Story = {};

export const WithIcon: Story = {
  args: {
    icon: 'pi pi-check'
  }
};

export const Loading: Story = {
  args: {
    loading: true
  }
};

export const Disabled: Story = {
  args: {
    disabled: true
  }
};

export const TextVariant: Story = {
  args: {
    text: true
  }
};

export const Severities: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="flex flex-wrap gap-2">
        <app-button label="Primary"></app-button>
        <app-button label="Secondary" severity="secondary"></app-button>
        <app-button label="Success" severity="success"></app-button>
        <app-button label="Info" severity="info"></app-button>
        <app-button label="Warning" severity="warn"></app-button>
        <app-button label="Help" severity="help"></app-button>
        <app-button label="Danger" severity="danger"></app-button>
        <app-button label="Contrast" severity="contrast"></app-button>
      </div>
    `
  })
};

export const VariantMatrix: Story = {
  render: () => ({
    template: `
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4">Button Variant Matrix (Figma reference)</h3>
        <table style="border-collapse:collapse;width:100%">
          <thead>
            <tr>
              <th class="text-xs p-2 text-left" style="border-bottom:1px solid var(--p-surface-300)">Severity</th>
              <th class="text-xs p-2 text-center" style="border-bottom:1px solid var(--p-surface-300)">Default</th>
              <th class="text-xs p-2 text-center" style="border-bottom:1px solid var(--p-surface-300)">With Icon</th>
              <th class="text-xs p-2 text-center" style="border-bottom:1px solid var(--p-surface-300)">Text</th>
              <th class="text-xs p-2 text-center" style="border-bottom:1px solid var(--p-surface-300)">Loading</th>
              <th class="text-xs p-2 text-center" style="border-bottom:1px solid var(--p-surface-300)">Disabled</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-xs p-2 font-medium">Primary</td>
              <td class="p-2 text-center"><app-button label="Action"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" icon="pi pi-check"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" [text]="true"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" [loading]="true"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" [disabled]="true"></app-button></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">Secondary</td>
              <td class="p-2 text-center"><app-button label="Action" severity="secondary"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="secondary" icon="pi pi-check"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="secondary" [text]="true"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="secondary" [loading]="true"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="secondary" [disabled]="true"></app-button></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">Success</td>
              <td class="p-2 text-center"><app-button label="Action" severity="success"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="success" icon="pi pi-check"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="success" [text]="true"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="success" [loading]="true"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="success" [disabled]="true"></app-button></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">Danger</td>
              <td class="p-2 text-center"><app-button label="Action" severity="danger"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="danger" icon="pi pi-trash"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="danger" [text]="true"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="danger" [loading]="true"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="danger" [disabled]="true"></app-button></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">Warning</td>
              <td class="p-2 text-center"><app-button label="Action" severity="warn"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="warn" icon="pi pi-exclamation-triangle"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="warn" [text]="true"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="warn" [loading]="true"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="warn" [disabled]="true"></app-button></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">Contrast</td>
              <td class="p-2 text-center"><app-button label="Action" severity="contrast"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="contrast" icon="pi pi-cog"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="contrast" [text]="true"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="contrast" [loading]="true"></app-button></td>
              <td class="p-2 text-center"><app-button label="Action" severity="contrast" [disabled]="true"></app-button></td>
            </tr>
          </tbody>
        </table>
      </div>
    `
  })
};
