import type { Meta, StoryObj } from '@storybook/angular';

import { JsonPreviewComponent } from './json-preview.component';

const meta: Meta<JsonPreviewComponent> = {
  title: 'Shared/Components/Data Display/Json Preview',
  component: JsonPreviewComponent,
  render: () => ({
    props: {
      jsonText: `{
  "status": "ACTIVE",
  "count": 3,
  "items": ["alpha", "beta", "gamma"]
}`
    },
    template: `<app-json-preview>{{ jsonText }}</app-json-preview>`
  })
};

export default meta;

type Story = StoryObj<JsonPreviewComponent>;

export const Default: Story = {};
