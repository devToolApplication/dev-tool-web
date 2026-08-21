import type { Meta, StoryObj } from '@storybook/angular';
import { ToolbarComponent } from './toolbar';

const meta: Meta<ToolbarComponent> = {
  title: 'Shared/Components/Layout/Toolbar',
  component: ToolbarComponent,
  args: {
    styleClass: ''
  },
  render: (args) => ({
    props: args,
    template: `
      <app-toolbar [styleClass]="styleClass">
        <div class="flex gap-2">
          <app-button label="common.create" icon="pi pi-plus"></app-button>
          <app-button label="common.delete" icon="pi pi-trash" severity="danger"></app-button>
        </div>
        <div class="flex gap-2">
          <app-button label="Export" icon="pi pi-download" severity="secondary"></app-button>
        </div>
      </app-toolbar>
    `
  })
};

export default meta;

type Story = StoryObj<ToolbarComponent>;

export const Default: Story = {};
