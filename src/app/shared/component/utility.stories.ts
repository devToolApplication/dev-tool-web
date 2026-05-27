import type { Meta, StoryObj } from '@storybook/angular';
import { FluidComponent } from './fluid/fluid';
import { RippleComponent } from './ripple/ripple';
import { IconFieldComponent } from './icon-field/icon-field';

const meta: Meta = {
  title: 'Shared/Components/Utility'
};

export default meta;

export const FluidDemo: StoryObj = {
  render: () => ({
    template: `
      <div class="p-4 bg-muted border rounded max-w-md">
        <h3 class="font-bold mb-4">Fluid Utility Component Demo</h3>
        <app-fluid>
          <app-input-text label="Full Width Fluid Input" placeholder="Type here..." class="mb-4 block"></app-input-text>
          <app-button label="Full Width Fluid Button" class="block"></app-button>
        </app-fluid>
      </div>
    `
  })
};

export const RippleDemo: StoryObj = {
  render: () => ({
    template: `
      <div class="flex gap-4 p-4">
        <div class="relative border rounded p-6 bg-surface-card flex items-center justify-center cursor-pointer select-none" style="width: 150px; height: 100px;">
          <span>Click me!</span>
          <app-ripple></app-ripple>
        </div>
      </div>
    `
  })
};

export const IconFieldDemo: StoryObj = {
  render: () => ({
    template: `
      <div class="p-4 max-w-sm">
        <h3 class="font-bold mb-4">IconField Demo</h3>
        <app-icon-field>
          <p-iconfield>
            <p-inputicon class="pi pi-search"></p-inputicon>
            <input type="text" pInputText placeholder="Search..." />
          </p-iconfield>
        </app-icon-field>
      </div>
    `
  })
};
