import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { SharedModule } from '@shared/shared.module';
import { KocNavigationComponent } from './koc-navigation.component';

const meta: Meta<KocNavigationComponent> = {
  title: 'Features/KOC Management/Components/KOC Navigation',
  component: KocNavigationComponent,
  decorators: [
    moduleMetadata({
      declarations: [KocNavigationComponent],
      imports: [SharedModule],
    }),
  ],
};

export default meta;

type Story = StoryObj<KocNavigationComponent>;

export const DefaultDesktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

export const MobileViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
};

export const TabletViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};