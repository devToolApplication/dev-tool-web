import type { Meta, StoryObj } from '@storybook/angular';

const radiusTokens = [
  { name: 'None', class: 'rounded-none', value: '0px' },
  { name: 'Small', class: 'rounded-sm', value: '2px' },
  { name: 'Default', class: 'rounded', value: '4px' },
  { name: 'Medium', class: 'rounded-md', value: '6px' },
  { name: 'Large', class: 'rounded-lg', value: '8px' },
  { name: 'XL', class: 'rounded-xl', value: '12px' },
  { name: '2XL', class: 'rounded-2xl', value: '16px' },
  { name: 'Full', class: 'rounded-full', value: '9999px' }
];

const meta: Meta = {
  title: 'Design System/Tokens/Border Radius',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Border radius tokens. Maps to Figma corner radius values.'
      }
    }
  }
};

export default meta;

type Story = StoryObj;

export const RadiusScale: Story = {
  render: () => ({
    template: `
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4">Border Radius Scale</h3>
        <div class="grid grid-cols-4 gap-6">
          ${radiusTokens.map(r => `
            <div class="flex flex-col items-center gap-2">
              <div
                class="${r.class}"
                style="width:80px;height:80px;background:var(--p-primary-500)"
              ></div>
              <span class="text-sm font-medium">${r.name}</span>
              <code class="text-xs" style="color:var(--p-text-muted-color)">${r.class} (${r.value})</code>
            </div>
          `).join('')}
        </div>
      </div>
    `
  })
};

export const UsageExamples: Story = {
  render: () => ({
    template: `
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4">Usage in Components</h3>
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-4">
            <button class="rounded px-3 py-1.5 text-sm" style="background:var(--p-primary-500);color:white">rounded — Buttons</button>
            <div class="rounded-lg p-3 text-sm" style="background:var(--p-surface-100);border:1px solid var(--p-surface-300)">rounded-lg — Cards, Panels</div>
            <div class="rounded-xl p-3 text-sm" style="background:var(--p-surface-100);border:1px solid var(--p-surface-300)">rounded-xl — Modals, Drawers</div>
            <div class="rounded-full px-3 py-1 text-xs font-medium" style="background:var(--p-green-500);color:white">rounded-full — Badges, Tags</div>
          </div>
        </div>
      </div>
    `
  })
};
