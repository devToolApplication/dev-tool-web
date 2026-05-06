import type { Meta, StoryObj } from '@storybook/angular';

import { FieldGuidePanelComponent } from './field-guide-panel.component';

const meta: Meta<FieldGuidePanelComponent> = {
  title: 'Shared/UI/FieldGuidePanel',
  component: FieldGuidePanelComponent,
  args: {
    title: 'codexAgent.form.fieldGuideTitle',
    description: 'codexAgent.form.fieldGuideDescription',
    fields: [
      { key: 'model', label: 'codexAgent.form.model', description: 'codexAgent.form.help.name' },
      { key: 'status', label: 'status', description: 'demo.description' }
    ],
    selections: [
      { title: 'codexAgent.form.selectedModel', description: 'Model' },
      { title: 'codexAgent.form.selectedApprovalPolicy', description: 'on-request' }
    ]
  }
};

export default meta;

type Story = StoryObj<FieldGuidePanelComponent>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    fields: [],
    selections: []
  }
};
