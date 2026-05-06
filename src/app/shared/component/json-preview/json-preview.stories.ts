import type { Meta, StoryObj } from '@storybook/angular';

import { JsonPreviewComponent } from './json-preview.component';

const meta: Meta<JsonPreviewComponent> = {
  title: 'Shared/Components/JsonPreview',
  component: JsonPreviewComponent,
  render: () => ({
    template: `<app-json-preview>{
  "status": "ACTIVE",
  "count": 3,
  "items": ["alpha", "beta", "gamma"]
}</app-json-preview>`
  })
};

export default meta;

type Story = StoryObj<JsonPreviewComponent>;

export const Default: Story = {};
