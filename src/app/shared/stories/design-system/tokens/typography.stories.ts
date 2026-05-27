import type { Meta, StoryObj } from '@storybook/angular';

const typographyScale = [
  { class: 'text-xs', size: '0.75rem / 12px', weight: '400' },
  { class: 'text-sm', size: '0.875rem / 14px', weight: '400' },
  { class: 'text-base', size: '1rem / 16px', weight: '400' },
  { class: 'text-lg', size: '1.125rem / 18px', weight: '400' },
  { class: 'text-xl', size: '1.25rem / 20px', weight: '600' },
  { class: 'text-2xl', size: '1.5rem / 24px', weight: '600' },
  { class: 'text-3xl', size: '1.875rem / 30px', weight: '700' },
  { class: 'text-4xl', size: '2.25rem / 36px', weight: '700' }
];

const fontWeights = [
  { class: 'font-light', value: '300' },
  { class: 'font-normal', value: '400' },
  { class: 'font-medium', value: '500' },
  { class: 'font-semibold', value: '600' },
  { class: 'font-bold', value: '700' }
];

const meta: Meta = {
  title: 'Design System/Tokens/Typography',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Typography scale and font weight tokens. Maps to Figma text styles.'
      }
    }
  }
};

export default meta;

type Story = StoryObj;

export const FontScale: Story = {
  render: () => ({
    template: `
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4">Font Size Scale</h3>
        <div class="flex flex-col gap-4">
          ${typographyScale.map(t => `
            <div class="flex items-baseline gap-4 border-b pb-2" style="border-color:var(--p-surface-200)">
              <span class="${t.class} font-semibold" style="min-width:200px">The quick brown fox</span>
              <code class="text-xs" style="color:var(--p-text-muted-color)">${t.class} — ${t.size}</code>
            </div>
          `).join('')}
        </div>
      </div>
    `
  })
};

export const FontWeights: Story = {
  render: () => ({
    template: `
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4">Font Weights</h3>
        <div class="flex flex-col gap-3">
          ${fontWeights.map(w => `
            <div class="flex items-baseline gap-4 border-b pb-2" style="border-color:var(--p-surface-200)">
              <span class="text-xl ${w.class}" style="min-width:250px">The quick brown fox</span>
              <code class="text-xs" style="color:var(--p-text-muted-color)">${w.class} (${w.value})</code>
            </div>
          `).join('')}
        </div>
      </div>
    `
  })
};

export const LineHeights: Story = {
  render: () => ({
    template: `
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4">Line Heights</h3>
        <div class="grid grid-cols-3 gap-6">
          <div>
            <p class="text-xs font-semibold mb-1">leading-tight (1.25)</p>
            <p class="text-base leading-tight" style="background:var(--p-surface-100);padding:8px">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
            </p>
          </div>
          <div>
            <p class="text-xs font-semibold mb-1">leading-normal (1.5)</p>
            <p class="text-base leading-normal" style="background:var(--p-surface-100);padding:8px">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
            </p>
          </div>
          <div>
            <p class="text-xs font-semibold mb-1">leading-relaxed (1.625)</p>
            <p class="text-base leading-relaxed" style="background:var(--p-surface-100);padding:8px">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
            </p>
          </div>
        </div>
      </div>
    `
  })
};
