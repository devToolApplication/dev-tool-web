import type { Meta, StoryObj } from '@storybook/angular';
import { FormInput } from './form-input';
import type { FormConfig, FormContext } from './models/form-config.model';

const formConfig: FormConfig = {
  fields: [
    {
      type: 'text',
      name: 'name',
      label: 'Strategy name',
      placeholder: 'Enter strategy name',
      width: '1/2',
      validation: [
        {
          expression: 'value == null || String(value).trim() === ""',
          message: 'Strategy name is required'
        }
      ]
    },
    {
      type: 'number',
      name: 'capital',
      label: 'Capital',
      width: '1/2',
      mode: 'currency',
      currency: 'USD',
      minFractionDigits: 0,
      maxFractionDigits: 0,
      validation: [
        {
          expression: 'value == null || value <= 0',
          message: 'Capital must be greater than 0'
        }
      ]
    },
    {
      type: 'select',
      name: 'status',
      label: 'Status',
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
      name: 'market',
      label: 'Market',
      width: '1/3',
      options: [
        { label: 'Spot', value: 'spot' },
        { label: 'Futures', value: 'futures' }
      ]
    },
    {
      type: 'checkbox',
      name: 'enabled',
      label: 'Enabled',
      width: '1/3'
    },
    {
      type: 'select-multi',
      name: 'channels',
      label: 'Channels',
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
      name: 'symbols',
      label: 'Symbols',
      placeholder: 'Type symbol and press enter',
      width: '1/2',
      options: [
        { label: 'BTCUSDT', value: 'BTCUSDT' },
        { label: 'ETHUSDT', value: 'ETHUSDT' },
        { label: 'SOLUSDT', value: 'SOLUSDT' }
      ]
    },
    {
      type: 'date',
      name: 'startDate',
      label: 'Start date',
      width: '1/2'
    },
    {
      type: 'auto-complete',
      name: 'owner',
      label: 'Owner',
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
      placeholder: 'Describe strategy rules',
      width: 'full',
      rows: 4,
      showZoomButton: true
    },
    {
      type: 'textarea',
      name: 'jsonConfig',
      label: 'JSON config',
      placeholder: '{ "risk": "medium" }',
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
      width: 'full',
      keyLabel: 'Key',
      valueLabel: 'Value',
      addButtonLabel: 'Add metadata'
    },
    {
      type: 'group',
      name: 'risk',
      label: 'Risk settings',
      width: 'full',
      children: [
        {
          type: 'number',
          name: 'maxDrawdown',
          label: 'Max drawdown',
          width: '1/2',
          minFractionDigits: 0,
          maxFractionDigits: 0
        },
        {
          type: 'select',
          name: 'profile',
          label: 'Profile',
          placeholder: 'Choose risk profile',
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
  name: 'Breakout Alpha',
  capital: 125000,
  status: 'active',
  market: 'futures',
  enabled: true,
  channels: ['email', 'webhook'],
  symbols: ['BTCUSDT', 'ETHUSDT'],
  startDate: new Date(2026, 3, 29),
  owner: 'Nguyen An',
  description: 'Enter on breakout with volume confirmation.',
  jsonConfig: '{\n  "risk": "medium",\n  "timeframe": "1h"\n}',
  metadata: {
    exchange: 'binance',
    account: 'paper'
  },
  risk: {
    maxDrawdown: 8,
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
          <div class="rounded-lg border border-surface-200 bg-surface-0 p-4">
            <h3 class="m-0 mb-3 text-base font-semibold">Current model</h3>
            <pre class="m-0 max-h-96 overflow-auto text-xs">{{ currentModel }}</pre>
          </div>

          <div class="mt-4 rounded-lg border border-surface-200 bg-surface-0 p-4">
            <h3 class="m-0 mb-3 text-base font-semibold">Last submit</h3>
            <pre class="m-0 max-h-80 overflow-auto text-xs">{{ submittedModel }}</pre>
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
