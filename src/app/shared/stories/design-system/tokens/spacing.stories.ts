import type { Meta, StoryObj } from '@storybook/angular';

const spacingScale = [
  { token: '0.25rem', px: '4px', class: 'p-1' },
  { token: '0.5rem', px: '8px', class: 'p-2' },
  { token: '0.75rem', px: '12px', class: 'p-3' },
  { token: '1rem', px: '16px', class: 'p-4' },
  { token: '1.25rem', px: '20px', class: 'p-5' },
  { token: '1.5rem', px: '24px', class: 'p-6' },
  { token: '2rem', px: '32px', class: 'p-8' },
  { token: '2.5rem', px: '40px', class: 'p-10' },
  { token: '3rem', px: '48px', class: 'p-12' },
  { token: '4rem', px: '64px', class: 'p-16' }
];

const meta: Meta = {
  title: 'Design System/Tokens/Spacing',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Spacing scale based on 4px grid. Maps to Figma auto-layout spacing values.'
      }
    }
  }
};

export default meta;

type Story = StoryObj;

export const Scale: Story = {
  render: () => ({
    template: `
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4">Spacing Scale (4px grid)</h3>
        <div class="flex flex-col gap-3">
          ${spacingScale.map(s => `
            <div class="flex items-center gap-4">
              <code class="text-xs" style="min-width:80px;color:var(--p-text-muted-color)">${s.class}</code>
              <div style="width:${s.token};height:24px;background:var(--p-primary-500);border-radius:4px"></div>
              <span class="text-xs" style="color:var(--p-text-muted-color)">${s.token} (${s.px})</span>
            </div>
          `).join('')}
        </div>
      </div>
    `
  })
};

export const GapDemo: Story = {
  render: () => ({
    template: `
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4">Gap Utilities</h3>
        <div class="flex flex-col gap-6">
          <div>
            <p class="text-xs font-semibold mb-2">gap-1 (4px)</p>
            <div class="flex gap-1">
              <div style="width:32px;height:32px;background:var(--p-primary-200);border-radius:4px"></div>
              <div style="width:32px;height:32px;background:var(--p-primary-300);border-radius:4px"></div>
              <div style="width:32px;height:32px;background:var(--p-primary-400);border-radius:4px"></div>
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold mb-2">gap-2 (8px)</p>
            <div class="flex gap-2">
              <div style="width:32px;height:32px;background:var(--p-primary-200);border-radius:4px"></div>
              <div style="width:32px;height:32px;background:var(--p-primary-300);border-radius:4px"></div>
              <div style="width:32px;height:32px;background:var(--p-primary-400);border-radius:4px"></div>
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold mb-2">gap-4 (16px)</p>
            <div class="flex gap-4">
              <div style="width:32px;height:32px;background:var(--p-primary-200);border-radius:4px"></div>
              <div style="width:32px;height:32px;background:var(--p-primary-300);border-radius:4px"></div>
              <div style="width:32px;height:32px;background:var(--p-primary-400);border-radius:4px"></div>
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold mb-2">gap-6 (24px)</p>
            <div class="flex gap-6">
              <div style="width:32px;height:32px;background:var(--p-primary-200);border-radius:4px"></div>
              <div style="width:32px;height:32px;background:var(--p-primary-300);border-radius:4px"></div>
              <div style="width:32px;height:32px;background:var(--p-primary-400);border-radius:4px"></div>
            </div>
          </div>
        </div>
      </div>
    `
  })
};
