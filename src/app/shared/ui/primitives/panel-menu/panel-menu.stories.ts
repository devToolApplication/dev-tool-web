import type { Meta, StoryObj } from '@storybook/angular';
import { PanelMenuComponent } from './panel-menu';

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

const meta: Meta<PanelMenuComponent> = {
  title: 'Shared/Components/Navigation/PanelMenu',
  component: PanelMenuComponent,
  args: {
    model: sampleMenuItems,
    multiple: true
  }
};

export default meta;

type Story = StoryObj<PanelMenuComponent>;

export const Default: Story = {};
