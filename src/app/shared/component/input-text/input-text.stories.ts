import type { Meta, StoryObj } from '@storybook/angular';
import { InputText } from './input-text';

const meta: Meta<InputText> = {
  title: 'Shared/Components/Form/InputText',
  component: InputText,
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    disabled: false,
    readonly: false,
    required: false,
    invalid: false,
    helpText: ''
  }
};

export default meta;

type Story = StoryObj<InputText>;

export const Default: Story = {};

export const WithHelpText: Story = {
  args: {
    helpText: 'Username must be unique and alphanumeric.'
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 'john_doe'
  }
};

export const Invalid: Story = {
  args: {
    invalid: true,
    errorMessage: 'Username is already taken.'
  }
};

export const Readonly: Story = {
  args: {
    readonly: true,
    value: 'john_doe_readonly'
  }
};

export const Anatomy: Story = {
  render: () => ({
    template: `
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4">InputText Anatomy (Figma reference)</h3>
        <table style="border-collapse:collapse;width:100%">
          <thead>
            <tr>
              <th class="text-xs p-2 text-left" style="border-bottom:1px solid var(--p-surface-300)">State</th>
              <th class="text-xs p-2 text-left" style="border-bottom:1px solid var(--p-surface-300)">Empty</th>
              <th class="text-xs p-2 text-left" style="border-bottom:1px solid var(--p-surface-300)">Filled</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-xs p-2 font-medium">Default</td>
              <td class="p-2"><app-input-text label="Label" placeholder="Placeholder"></app-input-text></td>
              <td class="p-2"><app-input-text label="Label" value="john_doe"></app-input-text></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">With Help</td>
              <td class="p-2"><app-input-text label="Label" placeholder="Placeholder" helpText="Helper text here"></app-input-text></td>
              <td class="p-2"><app-input-text label="Label" value="john_doe" helpText="Helper text here"></app-input-text></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">Invalid</td>
              <td class="p-2"><app-input-text label="Label" placeholder="Placeholder" [invalid]="true" errorMessage="Field is required"></app-input-text></td>
              <td class="p-2"><app-input-text label="Label" value="bad!" [invalid]="true" errorMessage="Invalid characters"></app-input-text></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">Disabled</td>
              <td class="p-2"><app-input-text label="Label" placeholder="Placeholder" [disabled]="true"></app-input-text></td>
              <td class="p-2"><app-input-text label="Label" value="john_doe" [disabled]="true"></app-input-text></td>
            </tr>
            <tr>
              <td class="text-xs p-2 font-medium">Readonly</td>
              <td class="p-2"><app-input-text label="Label" placeholder="—" [readonly]="true"></app-input-text></td>
              <td class="p-2"><app-input-text label="Label" value="john_doe" [readonly]="true"></app-input-text></td>
            </tr>
          </tbody>
        </table>
      </div>
    `
  })
};
