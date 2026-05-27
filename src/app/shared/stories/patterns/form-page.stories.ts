import type { Meta, StoryObj } from '@storybook/angular';

import type { FormConfig, FormContext } from '../../ui/form-input/models/form-config.model';

const formConfig: FormConfig = {
  title: 'Create Configuration',
  description: 'Fill in the details below to create a new configuration entry.',
  sections: [
    { id: 'basic', title: 'Basic Information' },
    { id: 'advanced', title: 'Advanced Settings', collapsible: true }
  ],
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      sectionId: 'basic',
      placeholder: 'Enter configuration name',
      validation: [{ type: 'required', expression: '!value', message: 'Name is required' }]
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      sectionId: 'basic',
      placeholder: 'Describe the purpose of this configuration'
    },
    {
      name: 'enabled',
      label: 'Enabled',
      type: 'checkbox',
      sectionId: 'basic'
    },
    {
      name: 'timeout',
      label: 'Timeout (ms)',
      type: 'number',
      sectionId: 'advanced',
      validation: [{ type: 'min', expression: 'value < 100', message: 'Minimum 100ms' }]
    },
    {
      name: 'retryCount',
      label: 'Retry Count',
      type: 'number',
      sectionId: 'advanced'
    },
    {
      name: 'environment',
      label: 'Environment',
      type: 'select',
      sectionId: 'advanced',
      options: [
        { label: 'Production', value: 'prod' },
        { label: 'Staging', value: 'staging' },
        { label: 'Development', value: 'dev' }
      ]
    }
  ]
};

const meta: Meta = {
  title: 'Patterns/Form Page',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Form page pattern: PageShell + ConfigTemplateForm with sections, validation, and sticky actions.
Used for create/edit flows. Figma: map as a page-level frame with form sections.
        `
      }
    }
  }
};

export default meta;

type Story = StoryObj;

export const CreateMode: Story = {
  render: () => ({
    props: {
      formConfig,
      context: { user: null, mode: 'create' } satisfies FormContext,
      initialValue: { enabled: true }
    },
    template: `
      <app-page-shell title="Create Configuration" subtitle="Add a new configuration entry">
        <div page-actions class="flex gap-2">
          <app-button label="Cancel" severity="secondary"></app-button>
          <app-button label="Save" icon="pi pi-check"></app-button>
        </div>
        <app-config-template-form
          [config]="formConfig"
          [context]="context"
          [initialValue]="initialValue"
        ></app-config-template-form>
      </app-page-shell>
    `
  })
};

export const EditMode: Story = {
  render: () => ({
    props: {
      formConfig,
      context: { user: null, mode: 'edit' } satisfies FormContext,
      initialValue: { name: 'Production Config', description: 'Main production settings', enabled: true, timeout: 5000, retryCount: 3, environment: 'prod' }
    },
    template: `
      <app-page-shell
        title="Edit Configuration"
        subtitle="Modify existing configuration"
        [breadcrumb]="[{ label: 'Configurations', routerLink: '/config' }, { label: 'Production Config' }]"
      >
        <div page-actions class="flex gap-2">
          <app-button label="Cancel" severity="secondary"></app-button>
          <app-button label="Update" icon="pi pi-check"></app-button>
        </div>
        <app-config-template-form
          [config]="formConfig"
          [context]="context"
          [initialValue]="initialValue"
        ></app-config-template-form>
      </app-page-shell>
    `
  })
};
