import type { Meta, StoryObj } from '@storybook/angular';
import { FormInput } from './form-input';
import type { FormConfig, FormContext } from './models/form-config.model';

const formConfig: FormConfig = {
  sections: [
    {
      id: 'general',
      title: 'shared.form.section.general',
      description: 'Core identity and state.'
    },
    {
      id: 'workflow',
      title: 'Workflow settings',
      description: 'Ownership, channels, and operator notes.'
    },
    {
      id: 'advanced',
      title: 'shared.form.advancedJson',
      description: 'Structured metadata, endpoints, and nested limits.'
    }
  ],
  fields: [
    {
      type: 'text',
      name: 'name',
      label: 'Workflow name',
      sectionId: 'general',
      placeholder: 'Enter workflow name',
      width: '1/2',
      validation: [
        {
          expression: 'value == null || String(value).trim() === ""',
          message: 'Workflow name is required'
        }
      ]
    },
    {
      type: 'number',
      name: 'budget',
      label: 'Budget',
      sectionId: 'general',
      width: '1/2',
      mode: 'currency',
      currency: 'USD',
      minFractionDigits: 0,
      maxFractionDigits: 0,
      validation: [
        {
          expression: 'value == null || value <= 0',
          message: 'Budget must be greater than 0'
        }
      ]
    },
    {
      type: 'select',
      name: 'status',
      label: 'Status',
      sectionId: 'general',
      placeholder: 'Choose status',
      width: '1/3',
      showClear: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' }
      ]
    },
    {
      type: 'radio',
      name: 'channelType',
      label: 'Channel type',
      sectionId: 'general',
      width: '1/3',
      options: [
        { label: 'Internal', value: 'internal' },
        { label: 'External', value: 'external' }
      ]
    },
    {
      type: 'checkbox',
      name: 'enabled',
      label: 'Enabled',
      sectionId: 'general',
      width: '1/3'
    },
    {
      type: 'select-multi',
      name: 'channels',
      label: 'Channels',
      sectionId: 'workflow',
      placeholder: 'Choose channels',
      width: '1/2',
      options: [
        { label: 'Email', value: 'email' },
        { label: 'Slack', value: 'slack' },
        { label: 'Webhook', value: 'webhook' }
      ]
    },
    {
      type: 'input-multi',
      name: 'codes',
      label: 'Codes',
      sectionId: 'workflow',
      placeholder: 'Type code and press enter',
      width: '1/2',
      options: [
        { label: 'PRD', value: 'PRD' },
        { label: 'OPS', value: 'OPS' },
        { label: 'QA', value: 'QA' }
      ]
    },
    {
      type: 'date',
      name: 'startDate',
      label: 'Start date',
      sectionId: 'workflow',
      width: '1/2'
    },
    {
      type: 'auto-complete',
      name: 'owner',
      label: 'Owner',
      sectionId: 'workflow',
      placeholder: 'Owner name',
      width: '1/2',
      options: [
        { label: 'Nguyen An', value: 'Nguyen An' },
        { label: 'Tran Binh', value: 'Tran Binh' },
        { label: 'Le Chi', value: 'Le Chi' }
      ]
    },
    {
      type: 'textarea',
      name: 'description',
      label: 'Description',
      sectionId: 'workflow',
      placeholder: 'Describe the workflow',
      width: 'full',
      rows: 4,
      showZoomButton: true
    },
    {
      type: 'textarea',
      name: 'jsonConfig',
      label: 'JSON config',
      sectionId: 'advanced',
      placeholder: '{ "priority": "medium" }',
      width: 'full',
      rows: 6,
      showZoomButton: true,
      contentType: 'json',
      jsonValidationMessage: 'JSON must be valid'
    },
    {
      type: 'record',
      name: 'metadata',
      label: 'Metadata',
      sectionId: 'advanced',
      width: 'full',
      keyLabel: 'Key',
      valueLabel: 'Value',
      addButtonLabel: 'Add metadata'
    },
    {
      type: 'tree',
      name: 'permissions',
      label: 'Permission tree',
      description: 'Search, review, and bulk-select operational permissions.',
      sectionId: 'advanced',
      width: 'full',
      treeConfig: {
        mode: 'select',
        selectionMode: 'checkbox',
        selectStrategy: 'leafOnly',
        searchable: true,
        showSelectedPanel: true,
        showFilterTabs: true,
        showToolbar: true,
        showNodeActions: false,
        showPath: true,
        showBadges: true,
        showCounts: true,
        selectionPresets: [
          {
            id: 'view-only',
            label: 'View only',
            icon: 'pi pi-eye',
            clearBeforeApply: true,
            match: { codeIncludes: ['view'], leafOnly: true }
          },
          {
            id: 'editor',
            label: 'Editor',
            icon: 'pi pi-pencil',
            clearBeforeApply: true,
            match: { codeIncludes: ['view', 'create', 'update'], leafOnly: true }
          }
        ]
      }
    },
    {
      type: 'secret-metadata',
      name: 'secretMetadata',
      label: 'secretMetadata',
      sectionId: 'advanced',
      width: 'full',
      options: [
        { label: 'Keycloak client secret', value: 'secret-keycloak-client' },
        { label: 'Basic auth password', value: 'secret-basic-password' }
      ]
    },
    {
      type: 'group',
      name: 'limits',
      label: 'Limit settings',
      sectionId: 'advanced',
      width: 'full',
      children: [
        {
          type: 'number',
          name: 'maxItems',
          label: 'Max items',
          width: '1/2',
          minFractionDigits: 0,
          maxFractionDigits: 0
        },
        {
          type: 'select',
          name: 'profile',
          label: 'Profile',
          placeholder: 'Choose profile',
          width: '1/2',
          options: [
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' }
          ]
        }
      ]
    },
    {
      type: 'array',
      name: 'endpoints',
      label: 'Endpoints',
      sectionId: 'advanced',
      width: 'full',
      itemConfig: [
        {
          type: 'text',
          name: 'name',
          label: 'Name',
          width: '1/2'
        },
        {
          type: 'text',
          name: 'url',
          label: 'URL',
          width: '1/2'
        }
      ]
    }
  ]
};

const context: FormContext = {
  user: {
    id: 'storybook-user',
    name: 'Storybook'
  },
  mode: 'edit'
};

const initialValue = {
  name: 'Approval Flow',
  budget: 125000,
  status: 'active',
  channelType: 'external',
  enabled: true,
  channels: ['email', 'webhook'],
  codes: ['PRD', 'OPS'],
  startDate: new Date(2026, 3, 29),
  owner: 'Nguyen An',
  description: 'Workflow for approval requests.',
  jsonConfig: '{\n  "priority": "medium",\n  "batchSize": 100\n}',
  metadata: {
    exchange: 'binance',
    account: 'paper'
  },
  permissions: [
    {
      id: 'system',
      key: 'system',
      label: 'System Management',
      code: 'SYS',
      type: 'module',
      children: [
        {
          id: 'system-user',
          key: 'system-user',
          label: 'User',
          code: 'SYS_USER',
          type: 'resource',
          children: [
            { id: 'system-user-view', key: 'system-user-view', label: 'View', code: 'USER_VIEW', type: 'action', checked: true },
            { id: 'system-user-create', key: 'system-user-create', label: 'Create', code: 'USER_CREATE', type: 'action', checked: true },
            { id: 'system-user-update', key: 'system-user-update', label: 'Update', code: 'USER_UPDATE', type: 'action' },
            { id: 'system-user-delete', key: 'system-user-delete', label: 'Delete', code: 'USER_DELETE', type: 'action', severity: 'danger' }
          ]
        },
        {
          id: 'system-role',
          key: 'system-role',
          label: 'Role',
          code: 'SYS_ROLE',
          type: 'resource',
          children: [
            { id: 'system-role-view', key: 'system-role-view', label: 'View', code: 'ROLE_VIEW', type: 'action', checked: true },
            { id: 'system-role-admin', key: 'system-role-admin', label: 'Admin', code: 'ROLE_ADMIN', type: 'action', severity: 'critical' }
          ]
        }
      ]
    },
    {
      id: 'storage',
      key: 'storage',
      label: 'Storage',
      code: 'STORAGE',
      type: 'module',
      children: [
        {
          id: 'storage-file',
          key: 'storage-file',
          label: 'File',
          code: 'STORAGE_FILE',
          type: 'resource',
          children: [
            { id: 'storage-file-view', key: 'storage-file-view', label: 'View', code: 'FILE_VIEW', type: 'action', checked: true },
            { id: 'storage-file-delete', key: 'storage-file-delete', label: 'Delete', code: 'FILE_DELETE', type: 'action', severity: 'danger' }
          ]
        }
      ]
    }
  ],
  secretMetadata: [
    {
      key: 'X-Trace-Source',
      type: 'RAW_TEXT',
      value: 'storybook'
    },
    {
      key: 'Authorization',
      type: 'BASIC_AUTH',
      config: {
        username: 'service-user',
        passwordSecretId: 'secret-basic-password'
      }
    },
    {
      key: 'Authorization',
      type: 'KEYCLOAK_AUTH',
      config: {
        tokenUrl: 'https://auth.example.com/realms/demo/protocol/openid-connect/token',
        clientId: 'demo-client',
        clientSecretId: 'secret-keycloak-client',
        grantType: 'CLIENT_CREDENTIALS',
        scope: 'openid profile'
      }
    }
  ],
  limits: {
    maxItems: 8,
    profile: 'medium'
  },
  endpoints: [
    {
      name: 'price-feed',
      url: 'https://api.example.com/prices'
    }
  ]
};

const meta: Meta<FormInput> = {
  title: 'Shared/UI/Form Input',
  component: FormInput,
  parameters: {
    layout: 'padded'
  }
};

export default meta;

type Story = StoryObj<FormInput>;

export const Default: Story = {
  args: {
    config: formConfig,
    context,
    initialValue,
    showSubmit: true,
    submitting: false
  },
  render: (args) => ({
    props: {
      ...args,
      currentModel: JSON.stringify(initialValue, null, 2),
      submittedModel: 'Submit the form to see payload',
      format: (value: unknown) => JSON.stringify(value, null, 2)
    },
    template: `
      <div class="grid max-w-7xl grid-cols-12 gap-6 p-4">
        <section class="col-span-12 xl:col-span-8">
          <app-form-input
            [config]="config"
            [context]="context"
            [initialValue]="initialValue"
            [showSubmit]="showSubmit"
            [submitting]="submitting"
            (valueChange)="currentModel = format($event)"
            (formSubmit)="submittedModel = format($event)"
          ></app-form-input>
        </section>

        <aside class="col-span-12 xl:col-span-4">
          <div class="rounded-lg border app-border app-bg-card p-4">
            <h3 class="m-0 mb-3 text-base font-semibold">Current model</h3>
            <pre class="m-0 max-h-96 overflow-auto text-xs" tabindex="0" aria-label="Current model JSON">{{ currentModel }}</pre>
          </div>

          <div class="mt-4 rounded-lg border app-border app-bg-card p-4">
            <h3 class="m-0 mb-3 text-base font-semibold">Last submit</h3>
            <pre class="m-0 max-h-80 overflow-auto text-xs" tabindex="0" aria-label="Last submit JSON">{{ submittedModel }}</pre>
          </div>
        </aside>
      </div>
    `
  })
};

export const Submitting: Story = {
  args: {
    config: formConfig,
    context,
    initialValue,
    showSubmit: true,
    submitting: true
  },
  render: Default.render
};

export const WithErrors: Story = {
  args: {
    config: formConfig,
    context,
    initialValue: {
      ...initialValue,
      name: '',
      budget: 0,
      jsonConfig: '{ invalid'
    },
    showSubmit: true,
    submitting: false,
    apiFieldErrors: {
      status: 'Status is required for active workflows'
    }
  },
  render: Default.render
};

export const Loading: Story = {
  args: {
    config: formConfig,
    context,
    initialValue,
    showSubmit: true,
    loading: true
  },
  render: Default.render
};

export const ReadonlyDetail: Story = {
  args: {
    config: formConfig,
    context: {
      ...context,
      mode: 'view'
    },
    initialValue,
    showSubmit: true
  },
  render: Default.render
};
