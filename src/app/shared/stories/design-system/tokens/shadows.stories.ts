import type { Meta, StoryObj } from '@storybook/angular';

const shadowLevels = [
  { name: 'None', class: 'shadow-none', css: 'none' },
  { name: 'Small', class: 'shadow-sm', css: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
  { name: 'Default', class: 'shadow', css: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' },
  { name: 'Medium', class: 'shadow-md', css: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' },
  { name: 'Large', class: 'shadow-lg', css: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' },
  { name: 'XL', class: 'shadow-xl', css: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' },
  { name: '2XL', class: 'shadow-2xl', css: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }
];

const meta: Meta = {
  title: 'Design System/Tokens/Shadows',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Elevation shadow tokens. Maps to Figma effect styles (drop shadow).'
      }
    }
  }
};

export default meta;

type Story = StoryObj;

export const ElevationLevels: Story = {
  render: () => ({
    template: `
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4">Shadow / Elevation Scale</h3>
        <div class="grid grid-cols-4 gap-6">
          ${shadowLevels.map(s => `
            <div class="flex flex-col items-center gap-2">
              <div
                class="${s.class}"
                style="width:96px;height:96px;border-radius:12px;background:var(--p-content-background);border:1px solid var(--p-surface-200)"
              ></div>
              <span class="text-sm font-medium">${s.name}</span>
              <code class="text-xs" style="color:var(--p-text-muted-color)">${s.class}</code>
            </div>
          `).join('')}
        </div>
      </div>
    `
  })
};

export const CardElevation: Story = {
  render: () => ({
    template: `
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4">Card Elevation Usage</h3>
        <div class="flex gap-6">
          <div class="shadow-sm p-4 rounded-lg" style="background:var(--p-content-background);border:1px solid var(--p-surface-200);width:200px">
            <p class="text-sm font-semibold">Flat card</p>
            <p class="text-xs mt-1" style="color:var(--p-text-muted-color)">shadow-sm — list items, table rows</p>
          </div>
          <div class="shadow-md p-4 rounded-lg" style="background:var(--p-content-background);width:200px">
            <p class="text-sm font-semibold">Raised card</p>
            <p class="text-xs mt-1" style="color:var(--p-text-muted-color)">shadow-md — cards, panels</p>
          </div>
          <div class="shadow-xl p-4 rounded-lg" style="background:var(--p-content-background);width:200px">
            <p class="text-sm font-semibold">Floating</p>
            <p class="text-xs mt-1" style="color:var(--p-text-muted-color)">shadow-xl — dropdowns, modals</p>
          </div>
        </div>
      </div>
    `
  })
};
