import type { Meta, StoryObj } from '@storybook/angular';

import { TabsComponent } from './tabs.component';

const meta: Meta<TabsComponent> = {
  title: 'Shared/Components/Tabs',
  component: TabsComponent,
  args: {
    value: 'general',
    tabs: [
      { label: 'general', value: 'general' },
      { label: 'settings', value: 'settings' },
      { label: 'metadata', value: 'metadata' }
    ]
  }
};

export default meta;

type Story = StoryObj<TabsComponent>;

export const Default: Story = {};

export const DisabledItem: Story = {
  args: {
    tabs: [
      { label: 'general', value: 'general' },
      { label: 'settings', value: 'settings', disabled: true },
      { label: 'metadata', value: 'metadata' }
    ]
  }
};
