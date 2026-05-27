import type { Meta, StoryObj } from '@storybook/angular';
import { AlertComponent } from './alert.component';

const meta: Meta<AlertComponent> = {
  title: 'Shared/UI/Feedback/Alert',
  component: AlertComponent,
  args: {
    variant: 'info',
    title: 'alert.title.info',
    message: 'This is a sample alert message detailing some system events.',
    dismissible: false
  }
};

export default meta;

type Story = StoryObj<AlertComponent>;

export const Info: Story = {};

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'alert.title.success',
    message: 'Transaction has been committed successfully.'
  }
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'alert.title.warning',
    message: 'System cache storage usage is above 85% threshold.'
  }
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    title: 'alert.title.danger',
    message: 'Failed connection to node api-gateway-01. Host is unreachable.'
  }
};

export const Dismissible: Story = {
  args: {
    dismissible: true
  }
};

export const WithAction: Story = {
  args: {
    variant: 'info',
    title: 'Updates Available',
    message: 'New firmware packages are ready to be installed.',
    actionLabel: 'common.upgrade'
  }
};

export const VariantMatrix: Story = {
  render: () => ({
    template: `
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4">Alert Variant Matrix (Figma reference)</h3>
        <table style="border-collapse:collapse;width:100%">
          <thead>
            <tr>
              <th class="text-xs p-2 text-left" style="border-bottom:1px solid var(--p-surface-300)">Variant</th>
              <th class="text-xs p-2 text-left" style="border-bottom:1px solid var(--p-surface-300)">Default</th>
              <th class="text-xs p-2 text-left" style="border-bottom:1px solid var(--p-surface-300)">Dismissible</th>
              <th class="text-xs p-2 text-left" style="border-bottom:1px solid var(--p-surface-300)">With Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-xs p-2 font-medium">Info</td>
              <td class="p-2"><app-alert variant="info" title="Info" message="Informational message."></app-alert></td>
              <td class="p-2"><app-alert variant="info" title="Info" message="Dismissible alert." [dismissible]="true"></app-alert></td>
              <td class="p-2"><app-alert variant="info" title="Info" message="With action." actionLabel="View"></app-alert></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">Success</td>
              <td class="p-2"><app-alert variant="success" title="Success" message="Operation completed."></app-alert></td>
              <td class="p-2"><app-alert variant="success" title="Success" message="Dismissible alert." [dismissible]="true"></app-alert></td>
              <td class="p-2"><app-alert variant="success" title="Success" message="With action." actionLabel="Details"></app-alert></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">Warning</td>
              <td class="p-2"><app-alert variant="warning" title="Warning" message="Approaching limit."></app-alert></td>
              <td class="p-2"><app-alert variant="warning" title="Warning" message="Dismissible alert." [dismissible]="true"></app-alert></td>
              <td class="p-2"><app-alert variant="warning" title="Warning" message="With action." actionLabel="Upgrade"></app-alert></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">Danger</td>
              <td class="p-2"><app-alert variant="danger" title="Error" message="Connection failed."></app-alert></td>
              <td class="p-2"><app-alert variant="danger" title="Error" message="Dismissible alert." [dismissible]="true"></app-alert></td>
              <td class="p-2"><app-alert variant="danger" title="Error" message="With action." actionLabel="Retry"></app-alert></td>
            </tr>
          </tbody>
        </table>
      </div>
    `
  })
};
