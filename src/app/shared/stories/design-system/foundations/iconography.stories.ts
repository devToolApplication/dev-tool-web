import type { Meta, StoryObj } from '@storybook/angular';

const iconCategories = [
  {
    title: 'Navigation',
    icons: ['pi-home', 'pi-arrow-left', 'pi-arrow-right', 'pi-chevron-down', 'pi-chevron-up', 'pi-chevron-left', 'pi-chevron-right', 'pi-bars', 'pi-ellipsis-v', 'pi-external-link']
  },
  {
    title: 'Actions',
    icons: ['pi-plus', 'pi-minus', 'pi-pencil', 'pi-trash', 'pi-check', 'pi-times', 'pi-refresh', 'pi-download', 'pi-upload', 'pi-copy', 'pi-save', 'pi-undo']
  },
  {
    title: 'Status & Feedback',
    icons: ['pi-check-circle', 'pi-times-circle', 'pi-exclamation-triangle', 'pi-info-circle', 'pi-question-circle', 'pi-ban', 'pi-spinner', 'pi-sync']
  },
  {
    title: 'Objects',
    icons: ['pi-file', 'pi-folder', 'pi-image', 'pi-calendar', 'pi-clock', 'pi-cog', 'pi-user', 'pi-users', 'pi-envelope', 'pi-bell', 'pi-search', 'pi-filter', 'pi-sort-alt']
  },
  {
    title: 'Data & Charts',
    icons: ['pi-chart-bar', 'pi-chart-line', 'pi-chart-pie', 'pi-database', 'pi-server', 'pi-cloud', 'pi-bolt', 'pi-code']
  },
  {
    title: 'Communication',
    icons: ['pi-comment', 'pi-comments', 'pi-send', 'pi-phone', 'pi-video', 'pi-link', 'pi-share-alt', 'pi-globe']
  }
];

const meta: Meta = {
  title: 'Design System/Foundations/Iconography',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'PrimeIcons catalog organized by category. Use class "pi pi-{name}" in templates. Maps to Figma icon library.'
      }
    }
  }
};

export default meta;

type Story = StoryObj;

export const IconCatalog: Story = {
  render: () => ({
    template: `
      <div class="p-4">
        ${iconCategories.map(cat => `
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-3">${cat.title}</h3>
            <div class="grid grid-cols-8 gap-4">
              ${cat.icons.map(icon => `
                <div class="flex flex-col items-center gap-2 p-2 rounded-lg" style="border:1px solid var(--p-surface-200)">
                  <i class="pi ${icon}" style="font-size:1.25rem;color:var(--p-text-color)"></i>
                  <span class="text-xs text-center" style="color:var(--p-text-muted-color)">${icon.replace('pi-', '')}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `
  })
};

export const IconSizes: Story = {
  render: () => ({
    template: `
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-4">Icon Sizes</h3>
        <div class="flex items-end gap-6">
          <div class="flex flex-col items-center gap-2">
            <i class="pi pi-home" style="font-size:0.75rem"></i>
            <span class="text-xs" style="color:var(--p-text-muted-color)">12px</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <i class="pi pi-home" style="font-size:1rem"></i>
            <span class="text-xs" style="color:var(--p-text-muted-color)">16px</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <i class="pi pi-home" style="font-size:1.25rem"></i>
            <span class="text-xs" style="color:var(--p-text-muted-color)">20px</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <i class="pi pi-home" style="font-size:1.5rem"></i>
            <span class="text-xs" style="color:var(--p-text-muted-color)">24px</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <i class="pi pi-home" style="font-size:2rem"></i>
            <span class="text-xs" style="color:var(--p-text-muted-color)">32px</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <i class="pi pi-home" style="font-size:3rem"></i>
            <span class="text-xs" style="color:var(--p-text-muted-color)">48px</span>
          </div>
        </div>
      </div>
    `
  })
};
