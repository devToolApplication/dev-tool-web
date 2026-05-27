import type { Meta, StoryObj } from '@storybook/angular';
import { TieredMenuComponent } from './tiered-menu';

const sampleMenuItems = [
  {
    label: 'File',
    icon: 'pi pi-fw pi-file',
    items: [
      {
        label: 'New',
        icon: 'pi pi-fw pi-plus',
        items: [
          { label: 'Bookmark', icon: 'pi pi-fw pi-bookmark' },
          { label: 'Video', icon: 'pi pi-fw pi-video' }
        ]
      },
      { label: 'Delete', icon: 'pi pi-fw pi-trash' }
    ]
  },
  {
    label: 'Edit',
    icon: 'pi pi-fw pi-pencil',
    items: [
      { label: 'Left', icon: 'pi pi-fw pi-align-left' },
      { label: 'Right', icon: 'pi pi-fw pi-align-right' }
    ]
  }
];

const meta: Meta<TieredMenuComponent> = {
  title: 'Shared/Components/Navigation/TieredMenu',
  component: TieredMenuComponent,
  args: {
    items: sampleMenuItems,
    popup: false
  }
};

export default meta;

type Story = StoryObj<TieredMenuComponent>;

export const Inline: Story = {};

export const Popup: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div>
        <p class="text-sm p-4 bg-muted border rounded mb-4">Note: Click button to toggle popup menu.</p>
        <app-button label="Open Menu" (buttonClick)="menu.toggle($event)"></app-button>
        <app-tiered-menu #menu [items]="items" [popup]="true"></app-tiered-menu>
      </div>
    `
  })
};
