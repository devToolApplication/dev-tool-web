import type { Meta, StoryObj } from '@storybook/angular';

const breakpoints = [
  { name: 'sm', min: '640px', description: 'Mobile landscape' },
  { name: 'md', min: '768px', description: 'Tablet' },
  { name: 'lg', min: '1024px', description: 'Desktop' },
  { name: 'xl', min: '1280px', description: 'Large desktop' },
  { name: '2xl', min: '1536px', description: 'Ultra-wide' }
];

const meta: Meta = {
  title: 'Design System/Foundations/Grid & Layout',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Responsive grid system and breakpoints. Maps to Figma frame constraints and auto-layout.'
      }
    }
  }
};

export default meta;

type Story = StoryObj;

export const Breakpoints: Story = {
  render: () => ({
    template: `
      <div class="p-6">
        <h3 class="text-lg font-semibold mb-4">Responsive Breakpoints</h3>
        <div class="flex flex-col gap-3">
          ${breakpoints.map(bp => `
            <div class="flex items-center gap-4">
              <code class="text-sm font-medium" style="min-width:40px">${bp.name}</code>
              <div style="width:${bp.min};max-width:100%;height:32px;background:var(--p-primary-100);border:2px solid var(--p-primary-400);border-radius:4px;position:relative">
                <span class="text-xs absolute right-2 top-1.5" style="color:var(--p-primary-700)">${bp.min}</span>
              </div>
              <span class="text-xs" style="color:var(--p-text-muted-color)">${bp.description}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `
  })
};

export const GridColumns: Story = {
  render: () => ({
    template: `
      <div class="p-6">
        <h3 class="text-lg font-semibold mb-4">Grid Column System</h3>
        <div class="flex flex-col gap-4">
          <div>
            <p class="text-xs font-semibold mb-2">1 column</p>
            <div class="grid grid-cols-1 gap-2">
              <div style="height:32px;background:var(--p-primary-200);border-radius:4px"></div>
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold mb-2">2 columns</p>
            <div class="grid grid-cols-2 gap-2">
              <div style="height:32px;background:var(--p-primary-200);border-radius:4px"></div>
              <div style="height:32px;background:var(--p-primary-300);border-radius:4px"></div>
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold mb-2">3 columns</p>
            <div class="grid grid-cols-3 gap-2">
              <div style="height:32px;background:var(--p-primary-200);border-radius:4px"></div>
              <div style="height:32px;background:var(--p-primary-300);border-radius:4px"></div>
              <div style="height:32px;background:var(--p-primary-400);border-radius:4px"></div>
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold mb-2">4 columns</p>
            <div class="grid grid-cols-4 gap-2">
              <div style="height:32px;background:var(--p-primary-200);border-radius:4px"></div>
              <div style="height:32px;background:var(--p-primary-300);border-radius:4px"></div>
              <div style="height:32px;background:var(--p-primary-400);border-radius:4px"></div>
              <div style="height:32px;background:var(--p-primary-500);border-radius:4px"></div>
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold mb-2">12 columns (full grid)</p>
            <div class="grid grid-cols-12 gap-1">
              ${Array.from({ length: 12 }, (_, i) => `<div style="height:32px;background:var(--p-primary-${200 + Math.floor(i / 2) * 100});border-radius:2px"></div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `
  })
};

export const CommonLayouts: Story = {
  render: () => ({
    template: `
      <div class="p-6">
        <h3 class="text-lg font-semibold mb-4">Common Page Layouts</h3>
        <div class="flex flex-col gap-6">
          <div>
            <p class="text-xs font-semibold mb-2">Sidebar + Content (admin pattern)</p>
            <div class="flex gap-2" style="height:120px">
              <div style="width:240px;background:var(--p-surface-200);border-radius:4px;padding:8px">
                <div class="text-xs font-medium">Sidebar (240px)</div>
              </div>
              <div class="flex-1" style="background:var(--p-surface-100);border-radius:4px;padding:8px">
                <div class="text-xs font-medium">Main content (flex-1)</div>
              </div>
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold mb-2">Content + Drawer (detail pattern)</p>
            <div class="flex gap-2" style="height:120px">
              <div class="flex-1" style="background:var(--p-surface-100);border-radius:4px;padding:8px">
                <div class="text-xs font-medium">Main content</div>
              </div>
              <div style="width:360px;background:var(--p-surface-200);border-radius:4px;padding:8px">
                <div class="text-xs font-medium">Drawer (360px)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  })
};
