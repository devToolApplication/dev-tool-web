import type { ActionToolbarAction } from '@shared/ui/layout/action-toolbar/action-toolbar.component';
import type { FilterPanelField } from '@shared/ui/layout/filter-panel/filter-panel.component';
import type { TableConfig } from '@shared/ui/patterns/table/models/table-config.model';
import { WorkflowDefinition, WorkflowRun } from './workflow-studio.model';

export function buildWorkflowRunListActions(): ActionToolbarAction[] {
  return [
    {
      id: 'trigger',
      label: 'workflowStudio.lifecycle.runWorkflow',
      icon: 'pi pi-play',
      placement: 'primary',
      variant: 'primary',
    },
    {
      id: 'refresh',
      label: 'refresh',
      icon: 'pi pi-refresh',
      placement: 'secondary',
      variant: 'ghost',
    },
  ];
}

export function buildWorkflowRunFilterFields(workflows: WorkflowDefinition[] = []): FilterPanelField[] {
  return [
    {
      key: 'workflowId',
      label: 'workflowStudio.lifecycle.workflow',
      type: 'select',
      placeholder: 'workflowStudio.lifecycle.searchPlaceholder',
      options: [
        { label: 'workflowStudio.runtime.status.all', value: '' },
        ...workflows.map((wf) => ({ label: wf.name || wf.id, value: wf.id })),
      ],
    },
    {
      key: 'status',
      label: 'workflowStudio.lifecycle.status',
      type: 'select',
      placeholder: 'workflowStudio.lifecycle.status',
      options: [
        { label: 'workflowStudio.runtime.status.all', value: '' },
        { label: 'workflowStudio.runtime.status.running', value: 'RUNNING' },
        { label: 'workflowStudio.runtime.status.completed', value: 'COMPLETED' },
        { label: 'workflowStudio.runtime.status.error', value: 'ERROR' },
        { label: 'workflowStudio.runtime.status.timedOut', value: 'TIMED_OUT' },
        { label: 'workflowStudio.runtime.status.cancelled', value: 'CANCELLED' },
        { label: 'workflowStudio.runtime.status.pending', value: 'PENDING' },
      ],
    },
  ];
}

export function buildWorkflowRunTableConfig(): TableConfig<WorkflowRun> {
  return {
    title: 'workflowStudio.lifecycle.runTableTitle',
    rowClickable: true,
    pagination: true,
    rows: 20,
    emptyTitle: 'workflowStudio.lifecycle.runEmptyTitle',
    emptyDescription: 'workflowStudio.lifecycle.runEmptyDescription',
    toolbar: {
      search: {
        visible: true,
        field: 'id',
        label: 'search',
        placeholder: 'workflowStudio.lifecycle.runSearchPlaceholder',
      },
      refresh: {
        visible: true,
        label: 'refresh',
        icon: 'pi pi-refresh',
      },
      columnVisibility: { visible: true },
      density: { visible: true },
    },
    columns: [
      {
        field: 'id',
        header: 'workflowStudio.lifecycle.runId',
        type: 'text',
        width: '14rem',
      },
      {
        field: 'workflowDefinitionId',
        header: 'workflowStudio.lifecycle.workflow',
        type: 'text',
        minWidth: '12rem',
      },
      {
        field: 'status',
        header: 'workflowStudio.lifecycle.status',
        type: 'badge',
        width: '10rem',
        badgeMap: {
          PENDING: 'muted',
          RUNNING: 'warning',
          WAITING_EXTERNAL: 'warning',
          COMPLETED: 'success',
          ERROR: 'danger',
          TIMED_OUT: 'danger',
          CANCELLED: 'danger',
        },
      },
      {
        field: 'finalOutcome',
        header: 'workflowStudio.lifecycle.outcome',
        type: 'text',
        width: '8rem',
      },
      {
        field: 'startedAt',
        header: 'workflowStudio.lifecycle.startedAt',
        type: 'date',
        width: '12rem',
      },
      {
        field: 'completedAt',
        header: 'workflowStudio.lifecycle.completedAt',
        type: 'date',
        width: '12rem',
      },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        width: '8rem',
        align: 'right',
        frozen: true,
        alignFrozen: 'right',
        actions: [
          {
            id: 'debug',
            label: 'workflowStudio.lifecycle.runDetailTitle',
            icon: 'pi pi-search',
            variant: 'ghost',
            onClick: () => undefined,
          },
        ],
      },
    ],
  };
}
