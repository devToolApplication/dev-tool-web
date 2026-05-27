import type { Meta, StoryObj } from '@storybook/angular';
import { SectionPanelComponent } from './section-panel.component';

const meta: Meta<SectionPanelComponent> = {
  title: 'Shared/UI/Layout/SectionPanel',
  component: SectionPanelComponent,
  args: {
    title: 'section.panel.demo.title',
    subtitle: 'section.panel.demo.subtitle',
    collapsible: false,
    collapsed: false,
    loading: false,
    empty: false,
    variant: 'default',
    density: 'comfortable'
  },
  render: (args) => ({
    props: args,
    template: `
      <app-section-panel
        [title]="title"
        [subtitle]="subtitle"
        [collapsible]="collapsible"
        [collapsed]="collapsed"
        [loading]="loading"
        [error]="error"
        [empty]="empty"
        [emptyTitle]="emptyTitle"
        [emptyDescription]="emptyDescription"
        [variant]="variant"
        [density]="density"
      >
        <div section-actions>
          <app-button label="common.add" icon="pi pi-plus" severity="secondary" [text]="true"></app-button>
        </div>
        
        <div class="p-4 border border-dashed rounded bg-surface-ground">
          <p>This is the standard section panel body content.</p>
        </div>

        <div section-footer class="flex justify-end p-2 border-t mt-4 bg-muted/20">
          <span class="text-xs text-muted-color">Last updated: Just now</span>
        </div>
      </app-section-panel>
    `
  })
};

export default meta;

type Story = StoryObj<SectionPanelComponent>;

export const Default: Story = {};

export const Collapsible: Story = {
  args: {
    collapsible: true
  }
};

export const Collapsed: Story = {
  args: {
    collapsible: true,
    collapsed: true
  }
};

export const Loading: Story = {
  args: {
    loading: true
  }
};

export const ErrorState: Story = {
  args: {
    error: 'Failed to fetch section records.'
  }
};

export const EmptyState: Story = {
  args: {
    empty: true,
    emptyDescription: 'No items in this section'
  }
};

export const MutedVariant: Story = {
  args: {
    variant: 'muted'
  }
};

export const WarningVariant: Story = {
  args: {
    variant: 'warning'
  }
};

export const DangerVariant: Story = {
  args: {
    variant: 'danger'
  }
};

export const CompactDensity: Story = {
  args: {
    density: 'compact'
  }
};
