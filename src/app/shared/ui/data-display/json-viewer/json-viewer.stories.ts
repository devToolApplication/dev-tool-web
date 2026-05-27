import type { Meta, StoryObj } from '@storybook/angular';
import { JsonViewerComponent } from './json-viewer.component';

const sampleJson = {
  id: 'workflow-001',
  name: 'Approval Flow',
  version: 2.1,
  enabled: true,
  settings: {
    maxRetries: 3,
    timeoutSeconds: 30,
    notificationEmail: 'admin@company.com',
    secretToken: 'shhh-this-is-a-secret-api-token'
  },
  tags: ['production', 'critical', 'billing']
};

const meta: Meta<JsonViewerComponent> = {
  title: 'Shared/UI/DataDisplay/JsonViewer',
  component: JsonViewerComponent,
  args: {
    value: sampleJson,
    collapsed: false,
    readonly: true,
    showRawToggle: true,
    showSearch: true,
    copyLabel: 'copy',
    maskSecrets: false
  }
};

export default meta;

type Story = StoryObj<JsonViewerComponent>;

export const Default: Story = {};

export const Collapsed: Story = {
  args: {
    collapsed: true
  }
};

export const MaskSecrets: Story = {
  args: {
    maskSecrets: true
  }
};

export const HideSearch: Story = {
  args: {
    showSearch: false
  }
};

export const RawModeDefault: Story = {
  render: (args) => ({
    props: args,
    template: `
      <app-json-viewer [value]="value" [showRawToggle]="showRawToggle"></app-json-viewer>
    `
  }),
  args: {
    value: JSON.stringify(sampleJson, null, 2)
  }
};
