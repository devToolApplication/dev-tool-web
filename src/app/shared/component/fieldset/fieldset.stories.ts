import type { Meta, StoryObj } from '@storybook/angular';
import { FieldsetComponent } from './fieldset.component';

const meta: Meta<FieldsetComponent> = {
  title: 'Shared/Components/Layout/Fieldset',
  component: FieldsetComponent,
  args: {
    legend: 'Fieldset Legend Title',
    toggleable: false,
    collapsed: false
  },
  render: (args) => ({
    props: args,
    template: `
      <app-fieldset [legend]="legend" [toggleable]="toggleable" [collapsed]="collapsed">
        <p class="m-0">
          This is some detailed content inside the fieldset layout panel.
        </p>
      </app-fieldset>
    `
  })
};

export default meta;

type Story = StoryObj<FieldsetComponent>;

export const Default: Story = {};

export const Toggleable: Story = {
  args: {
    toggleable: true
  }
};
