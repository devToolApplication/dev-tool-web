import type { Meta, StoryObj } from '@storybook/angular';

import type { FilterPanelField } from './layout/filter-panel/filter-panel.component';
import type { ActionToolbarAction } from './layout/action-toolbar/action-toolbar.component';
import type { KeyValueItem } from './data-display/key-value-list/key-value-list.component';
import type { TimelineItem } from './data-display/timeline/timeline.component';
import type { TableConfig } from './table/models/table-config.model';
import type { FormConfig, FormContext } from './form-input/models/form-config.model';
import type { FieldGuideFieldItem, FieldGuideOptionItem } from './field-guide-panel/field-guide-panel.component';
import type { ProgressState } from './realtime-progress-bar/realtime-progress-bar.component';

const sampleJson = {
  id: 'cfg-001',
  enabled: true,
  limits: {
    maxItems: 50,
    timeoutMs: 3000
  }
};

const meta: Meta = {
  title: 'Shared UI/Foundation',
  tags: ['autodocs']
};

export default meta;

type Story = StoryObj;

export const FeedbackStates: Story = {
  render: () => ({
    template: `
      <div class="app-stack">
        <app-alert severity="info" title="Inline alert" message="Use alerts for contextual page or form feedback."></app-alert>
        <app-empty-state
          title="No records"
          description="The current filters did not return data."
          variant="search"
          primaryActionLabel="Create"
          secondaryActionLabel="Reset filters"
        ></app-empty-state>
        <app-error-state
          title="Could not load data"
          message="The request failed."
          detail="GET /api/items returned 500"
          [showCopyDetail]="true"
        ></app-error-state>
        <app-loading-skeleton type="table" [rows]="4" [columns]="3"></app-loading-skeleton>
        <app-skeleton-table [rows]="3" [columns]="4"></app-skeleton-table>
        <app-skeleton-form [rows]="3"></app-skeleton-form>
        <app-skeleton-card [rows]="3"></app-skeleton-card>
      </div>
    `
  })
};

export const OverlayAndLayout: Story = {
  render: () => ({
    props: {
      filters: [
        { key: 'keyword', label: 'Keyword', type: 'text', placeholder: 'Search' },
        {
          key: 'state',
          label: 'State',
          type: 'select',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Paused', value: 'paused' }
          ]
        },
        { key: 'archived', label: 'Archived', type: 'boolean', advanced: true }
      ] satisfies FilterPanelField[],
      actions: [
        { id: 'refresh', label: 'Refresh', icon: 'pi pi-refresh', placement: 'primary', variant: 'primary' },
        { id: 'delete', label: 'Delete', icon: 'pi pi-trash', placement: 'secondary', variant: 'danger' }
      ] satisfies ActionToolbarAction[]
    },
    template: `
      <app-page-shell
        title="Shared UI page"
        subtitle="Generic header, filters, actions and drawer shell."
      >
        <app-action-toolbar page-actions [actions]="actions"></app-action-toolbar>

        <app-section-panel page-toolbar title="Filters" subtitle="Common filter block">
          <app-filter-panel [filters]="filters"></app-filter-panel>
        </app-section-panel>

        <app-drawer [open]="true" title="Drawer title" subtitle="Generic side panel" size="sm">
          Drawer body content.
          <div drawer-footer>
            <app-action-toolbar [actions]="actions"></app-action-toolbar>
          </div>
        </app-drawer>
      </app-page-shell>
    `
  })
};

export const ConfirmDialog: Story = {
  render: () => ({
    props: {
      actions: [
        {
          id: 'confirm-danger',
          label: 'Open danger confirm',
          icon: 'pi pi-trash',
          variant: 'danger',
          placement: 'primary',
          confirm: {
            title: 'Delete configuration',
            message: 'Delete this saved configuration and stop showing it in lists.',
            confirmText: 'Delete',
            cancelText: 'Keep',
            variant: 'danger'
          }
        },
        {
          id: 'confirm-warning',
          label: 'Open text confirm',
          icon: 'pi pi-exclamation-triangle',
          variant: 'warning',
          placement: 'secondary',
          confirm: {
            title: 'Reset runtime state',
            message: 'Reset clears temporary runtime state for this workspace.',
            confirmText: 'Reset',
            cancelText: 'Cancel',
            variant: 'warning',
            requireText: 'RESET'
          }
        }
      ] satisfies ActionToolbarAction[]
    },
    template: `
      <div class="app-stack">
        <app-action-toolbar [actions]="actions"></app-action-toolbar>
        <app-confirm-dialog-host></app-confirm-dialog-host>
      </div>
    `
  })
};

export const DataDisplay: Story = {
  render: () => ({
    props: {
      sampleJson,
      keyValues: [
        { label: 'Identifier', value: 'cfg-001', type: 'copyable' },
        { label: 'State', value: 'Active', type: 'badge', variant: 'success' },
        { label: 'Updated', value: new Date('2026-05-14T09:00:00Z'), type: 'datetime' },
        { label: 'Payload', value: sampleJson, type: 'json' }
      ] satisfies KeyValueItem[],
      timelineItems: [
        { title: 'Created', description: 'Initial version saved.', variant: 'success', time: '2026-05-14 09:00' },
        { title: 'Reviewed', description: 'Configuration reviewed.', variant: 'info', time: '2026-05-14 09:30' }
      ] satisfies TimelineItem[]
    },
    template: `
      <div class="app-stack">
        <app-badge label="Ready" variant="success"></app-badge>
        <app-copyable-text value="cfg-001" [maxLength]="10"></app-copyable-text>
        <app-key-value-list [items]="keyValues"></app-key-value-list>
        <app-json-viewer [value]="sampleJson" [collapsed]="false"></app-json-viewer>
        <app-diff-viewer [before]="{ enabled: false, limit: 10 }" [after]="{ enabled: true, limit: 25 }"></app-diff-viewer>
        <app-data-timeline [items]="timelineItems"></app-data-timeline>
      </div>
    `
  })
};

export const TableAndForm: Story = {
  render: () => ({
    props: {
      tableConfig: {
        rowClickable: true,
        emptyTitle: 'No items',
        columns: [
          { field: 'name', header: 'Name', type: 'text' },
          { field: 'state', header: 'State', type: 'badge', badgeMap: { active: 'success', paused: 'warning' } },
          { field: 'score', header: 'Score', type: 'semantic-number', suffix: '%' },
          { field: 'payload', header: 'Payload', type: 'json' },
          {
            field: 'actions',
            header: 'Actions',
            type: 'actions',
            actions: [
              {
                id: 'delete',
                label: 'Delete',
                icon: 'pi pi-trash',
                variant: 'danger',
                confirm: { message: 'Delete this item?', variant: 'danger' },
                onClick: () => undefined
              }
            ]
          }
        ]
      } satisfies TableConfig,
      rows: [
        { name: 'Alpha', state: 'active', score: 12, payload: sampleJson },
        { name: 'Beta', state: 'paused', score: -4, payload: { reason: 'manual' } }
      ],
      formConfig: {
        title: 'Generic form',
        description: 'Common validation summary and advanced JSON patterns.',
        fields: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            placeholder: 'Enter name',
            validation: [{ type: 'required', expression: '!value', message: 'Name is required' }]
          },
          {
            name: 'enabled',
            label: 'Enabled',
            type: 'checkbox'
          }
        ]
      } satisfies FormConfig,
      context: { user: null, mode: 'create' } satisfies FormContext,
      initialValue: { enabled: true }
    },
    template: `
      <div class="app-stack">
        <app-table [config]="tableConfig" [data]="rows"></app-table>
        <app-config-template-form
          [config]="formConfig"
          [context]="context"
          [initialValue]="initialValue"
        ></app-config-template-form>
      </div>
    `
  })
};

export const AdvancedControlsAndMetrics: Story = {
  render: () => ({
    props: {
      progressState: {
        id: 'task-102',
        title: 'Model Sync Job',
        status: 'running',
        percent: 68,
        step: 'Syncing weights...',
        message: 'Loaded layer 18 of 24'
      } as ProgressState,
      fields: [
        { key: 'temperature', label: 'Temperature', description: 'Controls randomness: lower values are more deterministic.' },
        { key: 'top_p', label: 'Top P', description: 'Nucleus sampling threshold for diverse output selection.' }
      ] as FieldGuideFieldItem[],
      warnings: [
        { title: 'API Limit', description: 'Exceeding 50 requests per min will trigger IP throttling.' }
      ] as FieldGuideOptionItem[]
    },
    template: `
      <div class="app-stack">
        <app-summary-metric-card
          label="Active Agents"
          [value]="18"
          trend="+12%"
          trendVariant="success"
        ></app-summary-metric-card>

        <app-summary-metric-card
          label="API Cost"
          [value]="4.24"
          prefix="$"
          trend="Budget safe"
          trendVariant="info"
        ></app-summary-metric-card>

        <app-realtime-progress-bar
          [state]="progressState"
          [showCancel]="true"
        ></app-realtime-progress-bar>

        <app-field-guide-panel
          title="Model settings help"
          description="A guide to configuring hyperparameters."
          [fields]="fields"
          [warnings]="warnings"
        ></app-field-guide-panel>
      </div>
    `
  })
};
