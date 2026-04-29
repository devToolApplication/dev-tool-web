import type { Meta, StoryObj } from '@storybook/angular';
import { BaseCrudPageComponent } from './base-crud-page.component';
import type { CrudPageConfig } from './base-crud-page.model';
import type { FormConfig, FormContext } from '../form-input/models/form-config.model';

const pageConfig: CrudPageConfig = {
  title: 'Strategy Configuration',
  description: 'Shared CRUD shell with projected form actions.',
  infoSection: {
    title: 'Review before saving',
    description: 'This section can show contextual guidance for the form.'
  },
  actions: [
    {
      id: 'save',
      label: 'Save',
      icon: 'pi pi-save',
      submitForm: true
    },
    {
      id: 'preview',
      label: 'Preview',
      icon: 'pi pi-eye',
      buttonClass: 'p-button-secondary'
    },
    {
      id: 'disabled',
      label: 'Disabled',
      icon: 'pi pi-lock',
      disabled: true
    }
  ]
};

const formConfig: FormConfig = {
  fields: [
    {
      type: 'text',
      name: 'name',
      label: 'Name',
      placeholder: 'Configuration name',
      width: '1/2',
      validation: [
        {
          expression: 'value == null || String(value).trim() === ""',
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
};

const formContext: FormContext = {
  user: { id: 'storybook-user' },
  mode: 'edit'
};

const formInitialValue = {
  name: 'Breakout Alpha',
  status: 'active',
  description: 'Entry strategy for momentum breakouts.'
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
    pageConfig,
    formConfig,
    formContext,
    formInitialValue,
    formVisible: true,
    submitting: false
  },
  render: (args) => ({
    props: {
      ...args,
      lastEvent: 'No action yet',
      format: (value: unknown) => JSON.stringify(value, null, 2)
    },
    template: `
      <div class="min-h-screen bg-surface-50 p-6">
        <app-base-crud-page
          [pageConfig]="pageConfig"
          [formConfig]="formConfig"
          [formContext]="formContext"
          [formInitialValue]="formInitialValue"
          [formVisible]="formVisible"
          [submitting]="submitting"
          (actionClick)="lastEvent = 'Action: ' + $event"
          (valueChange)="lastEvent = 'Value changed: ' + format($event)"
          (formSubmit)="lastEvent = 'Submitted: ' + format($event)"
        ></app-base-crud-page>

        <div class="mx-auto mt-4 max-w-6xl rounded-lg border border-surface-200 bg-surface-0 p-4">
          <pre class="m-0 whitespace-pre-wrap text-xs">{{ lastEvent }}</pre>
        </div>
      </div>
    `
  })
};

export const FormHidden: Story = {
  args: {
    pageConfig: {
      ...pageConfig,
      title: 'Read-only Shell'
    },
    formConfig,
    formContext,
    formInitialValue,
    formVisible: false,
    submitting: false
  },
  render: Default.render
};
