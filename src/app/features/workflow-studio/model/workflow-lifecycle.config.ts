import type { ActionToolbarAction } from '@shared/ui/layout/action-toolbar/action-toolbar.component';
import type { TableAction, TableConfig } from '@shared/ui/patterns/table/models/table-config.model';
import {
  WorkflowDefinition,
  WorkflowDetail,
  WorkflowRun,
  WorkflowVersion,
} from './workflow-studio.model';

export function createDraftWorkflowDetail(workflowId = ''): WorkflowDetail {
  return {
    definition: {
      id: workflowId,
      name: 'workflowStudio.lifecycle.untitled',
      description: null,
      status: 'DRAFT',
      currentDraftVersionId: 'draft-new',
      currentPublishedVersionId: null,
    },
    versions: [
      {
        id: 'draft-new',
        workflowDefinitionId: workflowId,
        version: 1,
        status: 'DRAFT',
        definition: {
          nodes: [
            { id: 'start-1', type: 'START' },
            { id: 'end-1', type: 'END' },
          ],
          edges: [{ source: 'start-1', target: 'end-1' }],
        },
        runtime: { maxParallel: 1 },
        compiledPlan: null,
        editor: {
          viewport: { x: 0, y: 0, zoom: 1 },
          nodes: {
            'start-1': { x: 80, y: 120 },
            'end-1': { x: 360, y: 120 },
          },
        },
      },
    ],
  };
}

export function buildWorkflowListActions(): ActionToolbarAction[] {
  return [
    {
      id: 'create',
      label: 'workflowStudio.lifecycle.create',
      icon: 'pi pi-plus',
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

export function buildWorkflowBuilderActions(
  options: { saving: boolean; readonlyMode: boolean; hasWorkflow: boolean },
): ActionToolbarAction[] {
  const disabled = options.saving || !options.hasWorkflow;
  return [
    {
      id: 'validate',
      label: 'workflowStudio.lifecycle.validate',
      icon: 'pi pi-check-circle',
      placement: 'secondary',
      variant: 'ghost',
      disabled,
    },
    {
      id: 'save',
      label: 'save',
      icon: 'pi pi-save',
      placement: 'primary',
      variant: 'primary',
      loading: options.saving,
      disabled: disabled || options.readonlyMode,
    },
    {
      id: 'versions',
      label: 'workflowStudio.lifecycle.versions',
      icon: 'pi pi-history',
      placement: 'secondary',
      variant: 'secondary',
      disabled,
    },
    {
      id: 'publish',
      label: 'workflowStudio.lifecycle.publish',
      icon: 'pi pi-send',
      placement: 'secondary',
      variant: 'secondary',
      loading: options.saving,
      disabled: disabled || options.readonlyMode,
    },
    {
      id: 'run',
      label: 'workflowStudio.lifecycle.run',
      icon: 'pi pi-play',
      placement: 'secondary',
      variant: 'secondary',
      disabled,
    },
  ];
}

export function buildWorkflowListTable(): TableConfig<WorkflowDefinition> {
  return {
    title: 'workflowStudio.lifecycle.tableTitle',
    rowClickable: true,
    pagination: true,
    rows: 20,
    emptyTitle: 'workflowStudio.lifecycle.emptyTitle',
    emptyDescription: 'workflowStudio.lifecycle.emptyDescription',
    toolbar: {
      search: {
        visible: true,
        field: 'keyword',
        label: 'search',
        placeholder: 'workflowStudio.lifecycle.searchPlaceholder',
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
      { field: 'name', header: 'workflowStudio.lifecycle.workflow', type: 'text', minWidth: '16rem', sortable: true },
      {
        field: 'status',
        header: 'workflowStudio.lifecycle.status',
        type: 'badge',
        width: '9rem',
        badgeMap: {
          DRAFT: 'info',
          ACTIVE: 'success',
          ARCHIVED: 'muted',
        },
      },
      {
        field: 'currentPublishedVersionId',
        header: 'workflowStudio.lifecycle.version',
        type: 'text',
        width: '10rem',
        formatter: (row: WorkflowDefinition) => versionCell(row),
      },
      { field: 'description', header: 'workflowStudio.lifecycle.description', type: 'text', minWidth: '18rem' },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        width: '12rem',
        align: 'right',
        frozen: true,
        alignFrozen: 'right',
        actions: workflowRowActions(),
      },
    ],
  };
}

export function buildWorkflowRunListTable(): TableConfig<WorkflowRun> {
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
        field: 'keyword',
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
      { field: 'id', header: 'workflowStudio.lifecycle.runId', type: 'copyable', minWidth: '12rem' },
      { field: 'workflowDefinitionId', header: 'workflowStudio.lifecycle.workflow', type: 'copyable', minWidth: '12rem' },
      {
        field: 'status',
        header: 'workflowStudio.lifecycle.status',
        type: 'badge',
        width: '10rem',
        badgeMap: {
          PENDING: 'muted',
          RUNNING: 'info',
          WAITING_EXTERNAL: 'warning',
          COMPLETED: 'success',
          ERROR: 'danger',
          TIMED_OUT: 'warning',
          CANCELLED: 'muted',
        },
      },
      { field: 'startedAt', header: 'workflowStudio.lifecycle.startedAt', type: 'datetime', width: '12rem' },
      { field: 'completedAt', header: 'workflowStudio.lifecycle.completedAt', type: 'datetime', width: '12rem' },
      { field: 'finalOutcome', header: 'workflowStudio.lifecycle.outcome', type: 'text', width: '9rem' },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        width: '10rem',
        align: 'right',
        frozen: true,
        alignFrozen: 'right',
        actions: workflowRunRowActions(),
      },
    ],
  };
}

export function buildWorkflowRunDetailActions(options: { loading: boolean; hasRun: boolean }): ActionToolbarAction[] {
  return [
    {
      id: 'retry',
      label: 'workflowStudio.lifecycle.retryRun',
      icon: 'pi pi-refresh',
      placement: 'primary',
      variant: 'primary',
      loading: options.loading,
      disabled: options.loading || !options.hasRun,
    },
  ];
}

export function workflowVersionLabel(version: Pick<WorkflowVersion, 'version' | 'status'>): string {
  return `v${version.version} - ${version.status}`;
}

export function readonlyModeForVersion(version: WorkflowVersion): boolean {
  return version.status === 'PUBLISHED';
}

function workflowRowActions(): TableAction<WorkflowDefinition>[] {
  return [
    { id: 'edit', label: 'edit', icon: 'pi pi-pencil', variant: 'ghost', onClick: () => undefined },
    { id: 'run', label: 'workflowStudio.lifecycle.run', icon: 'pi pi-play', variant: 'ghost', onClick: () => undefined },
    { id: 'publish', label: 'workflowStudio.lifecycle.publish', icon: 'pi pi-send', variant: 'ghost', onClick: () => undefined },
    { id: 'runs', label: 'workflowStudio.lifecycle.viewRuns', icon: 'pi pi-list', variant: 'ghost', onClick: () => undefined },
  ];
}

function workflowRunRowActions(): TableAction<WorkflowRun>[] {
  return [
    { id: 'detail', label: 'view', icon: 'pi pi-eye', variant: 'ghost', onClick: () => undefined },
    { id: 'retry', label: 'workflowStudio.lifecycle.retryRun', icon: 'pi pi-refresh', variant: 'ghost', onClick: () => undefined },
  ];
}

function versionCell(row: WorkflowDefinition): string {
  if (row.currentPublishedVersionId) {
    return row.currentPublishedVersionId;
  }
  return row.currentDraftVersionId ?? '';
}
