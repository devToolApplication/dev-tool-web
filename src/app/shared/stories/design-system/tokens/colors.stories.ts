import type { Meta, StoryObj } from '@storybook/angular';

const colorGroups = [
  {
    title: 'Primary',
    tokens: [
      '--p-primary-50', '--p-primary-100', '--p-primary-200', '--p-primary-300',
      '--p-primary-400', '--p-primary-500', '--p-primary-600', '--p-primary-700',
      '--p-primary-800', '--p-primary-900', '--p-primary-950'
    ]
  },
  {
    title: 'Surface',
    tokens: [
      '--p-surface-0', '--p-surface-50', '--p-surface-100', '--p-surface-200',
      '--p-surface-300', '--p-surface-400', '--p-surface-500', '--p-surface-600',
      '--p-surface-700', '--p-surface-800', '--p-surface-900', '--p-surface-950'
    ]
  },
  {
    title: 'Semantic',
    tokens: [
      '--p-green-500', '--p-yellow-500', '--p-orange-500', '--p-red-500',
      '--p-blue-500', '--p-purple-500', '--p-teal-500', '--p-cyan-500'
    ]
  },
  {
    title: 'Text & Content',
    tokens: [
      '--p-text-color', '--p-text-muted-color',
      '--p-content-background', '--p-content-border-color'
    ]
  }
];

function buildSwatchTemplate(): string {
  return colorGroups.map(group => `
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-3">${group.title}</h3>
      <div class="grid grid-cols-6 gap-3">
        ${group.tokens.map(token => `
          <div class="flex flex-col items-center gap-1">
            <div
              style="width:56px;height:56px;border-radius:8px;border:1px solid var(--p-surface-300);background:var(${token})"
            ></div>
            <span class="text-xs text-center" style="max-width:80px;word-break:break-all">${token.replace('--p-', '')}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

const meta: Meta = {
  title: 'Design System/Tokens/Colors',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Color palette tokens from PrimeNG theme. These map directly to Figma color styles.'
      }
    }
  }
};

export default meta;

type Story = StoryObj;

export const Palette: Story = {
  render: () => ({
    template: `<div class="p-4">${buildSwatchTemplate()}</div>`
  })
};

export const DarkMode: Story = {
  render: () => ({
    template: `<div class="p-4" data-theme="dark" style="background:var(--p-surface-900);color:var(--p-text-color)">${buildSwatchTemplate()}</div>`
  })
};
