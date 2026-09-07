import type { ActionToolbarAction } from '@shared/ui/layout/action-toolbar/action-toolbar.component';
import type { FilterPanelField } from '@shared/ui/layout/filter-panel/filter-panel.component';
import type { TableConfig } from '@shared/ui/patterns/table/models/table-config.model';
import { WorkflowDefinition, WorkflowTask } from './workflow-studio.model';

export function buildWorkflowTaskListActions(pollingActive = false): ActionToolbarAction[] {
  return [
    {
      id: 'polling',
      label: pollingActive ? 'workflowStudio.runtime.pollingActive' : 'workflowStudio.runtime.polling',
      icon: pollingActive ? 'pi pi-spin pi-sync' : 'pi pi-sync',
      placement: 'secondary',
      variant: pollingActive ? 'primary' : 'ghost',
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

export function buildWorkflowTaskFilterFields(workflows: WorkflowDefinition[] = []): FilterPanelField[] {
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
      key: 'assignmentStatus',
      label: 'workflowStudio.lifecycle.taskFilterAssignment',
      type: 'select',
      placeholder: 'workflowStudio.lifecycle.taskFilterAssignment',
      options: [
        { label: 'workflowStudio.lifecycle.taskFilterAll', value: 'all' },
        { label: 'workflowStudio.lifecycle.taskFilterUnassigned', value: 'unassigned' },
        { label: 'workflowStudio.lifecycle.taskFilterMyTasks', value: 'myTasks' },
      ],
    },
    {
      key: 'assignee',
      label: 'workflowStudio.lifecycle.taskAssignee',
      type: 'text',
      placeholder: 'workflowStudio.lifecycle.taskSearchPlaceholder',
    },
  ];
}

export function buildWorkflowTaskTableConfig(): TableConfig<WorkflowTask> {
  return {
    title: 'workflowStudio.lifecycle.taskTableTitle',
    rowClickable: true,
    pagination: true,
    rows: 20,
    emptyTitle: 'workflowStudio.lifecycle.taskEmptyTitle',
    emptyDescription: 'workflowStudio.lifecycle.taskEmptyDescription',
    toolbar: {
      search: {
        visible: true,
        field: 'name',
        label: 'search',
        placeholder: 'workflowStudio.lifecycle.taskSearchPlaceholder',
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
        field: 'name',
        header: 'workflowStudio.lifecycle.taskName',
        type: 'text',
        minWidth: '12rem',
      },
      {
        field: 'workflowName',
        header: 'workflowStudio.lifecycle.taskWorkflow',
        type: 'text',
        width: '10rem',
        formatter: (row) => row.workflowName || row.workflowId || '—',
      },
      {
        field: 'processInstanceId',
        header: 'workflowStudio.lifecycle.taskRunId',
        type: 'link',
        width: '14rem',
        link: (row) => ['/ai-agent-mcrs/workflows/runs', row.processInstanceId],
      },
      {
        field: 'taskDefinitionKey',
        header: 'workflowStudio.lifecycle.taskFormKey',
        type: 'text',
        width: '10rem',
      },
      {
        field: 'assignee',
        header: 'workflowStudio.lifecycle.taskAssignee',
        type: 'text',
        width: '8rem',
        formatter: (row) => row.assignee || '—',
      },
      {
        field: 'createTime',
        header: 'workflowStudio.lifecycle.taskCreatedAt',
        type: 'date',
        width: '10rem',
      },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        width: '10rem',
        align: 'right',
        frozen: true,
        alignFrozen: 'right',
        actions: [
          {
            id: 'claim',
            label: 'workflowStudio.lifecycle.taskClaimAction',
            icon: 'pi pi-user-plus',
            variant: 'ghost',
            visible: (row) => !row.assignee,
            onClick: () => undefined,
          },
          {
            id: 'unclaim',
            label: 'workflowStudio.lifecycle.taskUnclaimAction',
            icon: 'pi pi-user-minus',
            variant: 'ghost',
            visible: (row) => Boolean(row.assignee),
            onClick: () => undefined,
          },
          {
            id: 'handle',
            label: 'workflowStudio.lifecycle.taskHandleAction',
            icon: 'pi pi-play',
            variant: 'ghost',
            visible: (row) => !row.formKey || !row.formKey.startsWith('/'),
            onClick: () => undefined,
          },
          {
            id: 'navigate',
            label: 'workflowStudio.lifecycle.taskNavigateAction',
            icon: 'pi pi-external-link',
            variant: 'ghost',
            visible: (row) => Boolean(row.formKey && row.formKey.startsWith('/')),
            onClick: () => undefined,
          },
          {
            id: 'complete',
            label: 'workflowStudio.lifecycle.taskCompleteAction',
            icon: 'pi pi-check',
            variant: 'primary',
            onClick: () => undefined,
          },
        ],
      },
    ],
  };
}
