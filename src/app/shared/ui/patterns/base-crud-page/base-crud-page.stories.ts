import type { Meta, StoryObj } from '@storybook/angular';
import { BaseCrudPageComponent } from './base-crud-page.component';
import type { BaseCrudPageConfig } from './base-crud-page.model';
import type { FormContext } from '../form-input/models/form-config.model';

const config: BaseCrudPageConfig = {
  title: 'Workflow Configuration',
  description: 'Shared CRUD shell rendered from a small page config.',
  infoSection: {
    title: 'Review before saving',
    description: 'Feature pages own navigation and persistence behavior.'
  },
  actions: [
    {
      id: 'save',
      label: 'Save',
      icon: 'pi pi-save',
      kind: 'submit'
    },
    {
      id: 'preview',
      label: 'Preview',
      kind: 'button',
      icon: 'pi pi-eye',
      severity: 'secondary'
    },
    {
      id: 'disabled',
      label: 'Disabled',
      kind: 'button',
      icon: 'pi pi-lock',
      disabled: true
    }
  ],
  form: {
    fields: [
      {
        type: 'text',
        name: 'name',
        label: 'Name',
        placeholder: 'Configuration name',
        width: '1/2',
        validation: [
          {
            type: 'required',
            message: 'Name is required'
          }
        ]
      },
      {
        type: 'select',
        name: 'status',
        label: 'Status',
        placeholder: 'Choose status',
        width: '1/2',
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Active', value: 'active' },
          { label: 'Paused', value: 'paused' }
        ]
      },
      {
        type: 'textarea',
        name: 'description',
        label: 'Description',
        placeholder: 'Describe the configuration',
        width: 'full',
        rows: 4
      }
    ]
  }
};

const context: FormContext = {
  user: { id: 'storybook-user' },
  mode: 'edit'
};

const model = {
  name: 'Approval Flow',
  status: 'active',
  description: 'Workflow for approval requests.'
};

const meta: Meta<BaseCrudPageComponent> = {
  title: 'Shared/UI/Base CRUD Page',
  component: BaseCrudPageComponent,
  parameters: {
    layout: 'fullscreen'
  }
};

export default meta;

type Story = StoryObj<BaseCrudPageComponent>;

export const Default: Story = {
  args: {
    config,
    context,
    model,
    busy: false
  },
  render: (args) => ({
    props: {
      ...args,
      lastEvent: 'No action yet',
      format: (value: unknown) => JSON.stringify(value, null, 2)
    },
    template: `
      <div class="min-h-screen app-bg-soft p-6">
        <app-base-crud-page
          [config]="config"
          [context]="context"
          [model]="model"
          [busy]="busy"
          (action)="lastEvent = 'Action: ' + $event.id"
          (valueChange)="lastEvent = 'Value changed: ' + format($event)"
          (submit)="lastEvent = 'Submitted: ' + format($event)"
        ></app-base-crud-page>

        <div class="mx-auto mt-4 max-w-6xl rounded-lg border app-border app-bg-card p-4">
          <pre class="m-0 whitespace-pre-wrap text-xs">{{ lastEvent }}</pre>
        </div>
      </div>
    `
  })
};

export const WithProjectedContent: Story = {
  args: {
    config: {
      ...config,
      title: 'CRUD Shell With Preview'
    },
    context,
    model,
    busy: false
  },
  render: (args) => ({
    props: {
      ...args,
      lastEvent: 'No action yet',
      format: (value: unknown) => JSON.stringify(value, null, 2)
    },
    template: `
      <div class="min-h-screen app-bg-soft p-6">
        <app-base-crud-page
          [config]="config"
          [context]="context"
          [model]="model"
          [busy]="busy"
          (action)="lastEvent = 'Action: ' + $event.id"
          (valueChange)="lastEvent = 'Value changed: ' + format($event)"
          (submit)="lastEvent = 'Submitted: ' + format($event)"
        >
          <div crud-page-before-form class="rounded-lg border app-border app-bg-card p-4 app-shadow-sm">
            <div class="text-sm font-semibold">Projected preview</div>
            <div class="mt-1 text-sm app-text-muted">Content in this slot renders above the form.</div>
          </div>
          <div crud-page-after-form class="mt-4 rounded-lg border app-border app-bg-card p-4 app-shadow-sm">
            <div class="text-sm font-semibold">Projected detail</div>
            <div class="mt-1 text-sm app-text-muted">Content in this slot renders after the form.</div>
          </div>
        </app-base-crud-page>

        <div class="mx-auto mt-4 max-w-6xl rounded-lg border app-border app-bg-card p-4">
          <pre class="m-0 whitespace-pre-wrap text-xs">{{ lastEvent }}</pre>
        </div>
      </div>
    `
  })
};
