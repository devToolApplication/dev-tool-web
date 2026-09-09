import type { KeycloakService } from '../../../../core/auth/keycloak.service';
import type { ActionToolbarAction } from '../../../../shared/ui/layout/action-toolbar/action-toolbar.component';
import type { FilterPanelField } from '../../../../shared/ui/layout/filter-panel/filter-panel.component';
import type { TableConfig } from '../../../../shared/ui/patterns/table/models/table-config.model';
import type { AppTabItem } from '../../../../shared/ui/primitives/tabs/tabs.component';
import {
  SUPPORTED_FORM_KEYS,
  UserTaskQuery,
  UserTaskStatus,
  UserTaskSummary,
  UserTaskView,
} from '../../models/user-task.model';

export const PRIMARY_COLUMN_FIELDS: readonly string[] = ['task', 'status', 'actions'];

export const ALL_COLUMN_FIELDS: readonly string[] = [
  'task',
  'workflow',
  'formKey',
  'assignee',
  'createdAt',
  'status',
  'actions',
];

export interface InboxErrorDetail {
  errorCode: string;
  errorMessage: string;
}

export function isAiAgentAdmin(keycloak: KeycloakService | null | undefined): boolean {
  if (!keycloak) {
    return false;
  }
  const userInfo = keycloak.userInfo as
    | { realm_access?: { roles?: string[] }; roles?: string[] }
    | undefined;
  const realmRoles = userInfo?.realm_access?.roles ?? userInfo?.roles;
  if (Array.isArray(realmRoles)) {
    return realmRoles.includes('ai_agent_admin');
  }
  if (typeof keycloak.hasRole === 'function') {
    return keycloak.hasRole('ai_agent_admin');
  }
  return false;
}

export function buildUserTaskViewTabs(isAdmin: boolean): AppTabItem[] {
  const tabs: AppTabItem[] = [
    { label: 'userTask.view.my', value: 'MY' },
    { label: 'userTask.view.claimable', value: 'CLAIMABLE' },
  ];
  if (isAdmin) {
    tabs.push({ label: 'userTask.view.all', value: 'ALL' });
  }
  return tabs;
}

export function buildUserTaskToolbarActions(): ActionToolbarAction[] {
  return [
    {
      id: 'refresh',
      label: 'refresh',
      icon: 'pi pi-refresh',
      placement: 'secondary',
      variant: 'ghost',
    },
  ];
}

export function buildUserTaskFilterFields(): FilterPanelField[] {
  return [
    {
      key: 'keyword',
      label: 'search',
      type: 'text',
      placeholder: 'userTask.filter.searchPlaceholder',
    },
    {
      key: 'formKey',
      label: 'userTask.column.formKey',
      type: 'select',
      placeholder: 'userTask.filter.allFormKeys',
      options: [
        { label: 'userTask.filter.allFormKeys', value: '' },
        {
          label: SUPPORTED_FORM_KEYS.KOC_CANDIDATE_APPROVAL,
          value: SUPPORTED_FORM_KEYS.KOC_CANDIDATE_APPROVAL,
        },
        {
          label: SUPPORTED_FORM_KEYS.KOC_DISCOVERY_DECISION,
          value: SUPPORTED_FORM_KEYS.KOC_DISCOVERY_DECISION,
        },
        {
          label: SUPPORTED_FORM_KEYS.MANUAL_2FA_CONFIRMATION,
          value: SUPPORTED_FORM_KEYS.MANUAL_2FA_CONFIRMATION,
        },
        { label: SUPPORTED_FORM_KEYS.APPROVAL, value: SUPPORTED_FORM_KEYS.APPROVAL },
      ],
    },
    {
      key: 'status',
      label: 'status',
      type: 'select',
      placeholder: 'status',
      options: [
        { label: 'all', value: '' },
        { label: 'userTask.status.active', value: 'ACTIVE' },
        { label: 'userTask.status.completed', value: 'COMPLETED' },
      ],
    },
    {
      key: 'businessKey',
      label: 'userTask.column.workflow',
      type: 'text',
      placeholder: 'userTask.filter.businessKeyPlaceholder',
    },
    {
      key: 'dueRange',
      label: 'workflowStudio.lifecycle.taskDueDate',
      type: 'date-range',
    },
  ];
}

export function buildUserTaskTableConfig(
  onOpenTask: (taskId: string) => void,
): TableConfig<UserTaskSummary> {
  return {
    title: 'userTask.nav.title',
    emptyTitle: 'userTask.empty.title',
    emptyDescription: 'userTask.empty.description',
    rowClickable: true,
    pagination: true,
    rows: 10,
    rowsPerPageOptions: [10, 20, 50],
    columns: [
      {
        field: 'task',
        header: 'userTask.column.task',
        type: 'custom',
        minWidth: '14rem',
        hideable: false,
      },
      {
        field: 'workflow',
        header: 'userTask.column.workflow',
        type: 'custom',
        minWidth: '12rem',
        hideable: true,
      },
      {
        field: 'formKey',
        header: 'userTask.column.formKey',
        type: 'custom',
        width: '12rem',
        hideable: true,
      },
      {
        field: 'assignee',
        header: 'userTask.column.assignee',
        type: 'custom',
        width: '10rem',
        hideable: true,
      },
      {
        field: 'createdAt',
        header: 'userTask.column.created',
        type: 'custom',
        width: '12rem',
        hideable: true,
      },
      {
        field: 'status',
        header: 'status',
        type: 'custom',
        width: '9rem',
        hideable: false,
      },
      {
        field: 'actions',
        header: 'userTask.column.actions',
        type: 'actions',
        width: '7rem',
        align: 'right',
        frozen: true,
        alignFrozen: 'right',
        hideable: false,
        actions: [
          {
            id: 'open',
            label: 'userTask.actions.open',
            icon: 'pi pi-arrow-right',
            variant: 'ghost',
            tooltip: 'userTask.actions.open',
            showLabel: false,
            onClick: (row: UserTaskSummary) => onOpenTask(row.taskId),
          },
        ],
      },
    ],
  };
}

export function serializeUserTaskQuery(query: UserTaskQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (query.view) {
    params['view'] = query.view;
  }
  if (query.status) {
    params['status'] = query.status;
  }
  if (query.keyword && query.keyword.trim()) {
    params['keyword'] = query.keyword.trim();
  }
  if (query.formKey && query.formKey.length > 0) {
    params['formKey'] = query.formKey;
  }
  if (query.businessKey && query.businessKey.trim()) {
    params['businessKey'] = query.businessKey.trim();
  }
  if (query.dueAfter) {
    params['dueAfter'] = query.dueAfter;
  }
  if (query.dueBefore) {
    params['dueBefore'] = query.dueBefore;
  }
  if (query.page !== undefined && query.page !== null) {
    params['page'] = query.page;
  }
  if (query.size !== undefined && query.size !== null) {
    params['size'] = query.size;
  }
  if (query.sort) {
    params['sort'] = query.sort;
  }
  return params;
}

export function parseUserTaskQuery(
  params: Record<string, unknown>,
  isAdmin: boolean,
): UserTaskQuery {
  let view: UserTaskView = 'MY';
  if (params['view'] === 'CLAIMABLE') {
    view = 'CLAIMABLE';
  } else if (params['view'] === 'ALL') {
    view = isAdmin ? 'ALL' : 'MY';
  }

  const rawStatus =
    typeof params['status'] === 'string' ? params['status'].trim().toUpperCase() : undefined;
  const status: UserTaskStatus | undefined =
    rawStatus === 'ACTIVE' || rawStatus === 'COMPLETED' ? rawStatus : undefined;

  const keyword =
    typeof params['keyword'] === 'string' && params['keyword'].trim()
      ? params['keyword'].trim()
      : undefined;

  const formKey =
    typeof params['formKey'] === 'string' && params['formKey'].length > 0
      ? params['formKey']
      : undefined;

  const businessKey =
    typeof params['businessKey'] === 'string' && params['businessKey'].trim()
      ? params['businessKey'].trim()
      : undefined;

  const dueAfter =
    typeof params['dueAfter'] === 'string' && params['dueAfter'].trim()
      ? params['dueAfter'].trim()
      : undefined;

  const dueBefore =
    typeof params['dueBefore'] === 'string' && params['dueBefore'].trim()
      ? params['dueBefore'].trim()
      : undefined;

  const rawPage = Number(params['page']);
  const page = Number.isInteger(rawPage) && rawPage >= 0 ? rawPage : 0;

  const rawSize = Number(params['size']);
  const size = Number.isInteger(rawSize) && rawSize > 0 ? rawSize : 10;

  const sort =
    typeof params['sort'] === 'string' && params['sort'].trim()
      ? params['sort'].trim()
      : 'createdAt,desc';

  return {
    view,
    ...(status ? { status } : {}),
    ...(keyword ? { keyword } : {}),
    ...(formKey ? { formKey } : {}),
    ...(businessKey ? { businessKey } : {}),
    ...(dueAfter ? { dueAfter } : {}),
    ...(dueBefore ? { dueBefore } : {}),
    page,
    size,
    sort,
  };
}

export function queryToFilterValues(query: UserTaskQuery): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  if (query.keyword) values['keyword'] = query.keyword;
  if (query.formKey) values['formKey'] = query.formKey;
  if (query.status) values['status'] = query.status;
  if (query.businessKey) values['businessKey'] = query.businessKey;

  const afterIso = query.dueAfter;
  const beforeIso = query.dueBefore;
  if (afterIso || beforeIso) {
    const from = afterIso ? new Date(afterIso) : null;
    const to = beforeIso ? new Date(beforeIso) : null;
    values['dueRange'] = {
      from: from && !Number.isNaN(from.getTime()) ? from : null,
      to: to && !Number.isNaN(to.getTime()) ? to : null,
    };
  }
  return values;
}

export function filterValuesToQuery(
  values: Record<string, unknown>,
  currentQuery: UserTaskQuery,
): UserTaskQuery {
  const keyword =
    typeof values['keyword'] === 'string' && values['keyword'].trim()
      ? values['keyword'].trim()
      : undefined;
  const formKey =
    typeof values['formKey'] === 'string' && values['formKey'].length > 0
      ? values['formKey']
      : undefined;
  const rawStatus =
    typeof values['status'] === 'string' ? values['status'].trim().toUpperCase() : undefined;
  const status: UserTaskStatus | undefined =
    rawStatus === 'ACTIVE' || rawStatus === 'COMPLETED' ? rawStatus : undefined;
  const businessKey =
    typeof values['businessKey'] === 'string' && values['businessKey'].trim()
      ? values['businessKey'].trim()
      : undefined;

  let dueAfter: string | undefined;
  let dueBefore: string | undefined;

  const dueRange = values['dueRange'] as { from?: unknown; to?: unknown } | undefined;
  if (dueRange && typeof dueRange === 'object') {
    if (dueRange.from) {
      const d = dueRange.from instanceof Date ? dueRange.from : new Date(String(dueRange.from));
      if (!Number.isNaN(d.getTime())) {
        dueAfter = d.toISOString();
      }
    }
    if (dueRange.to) {
      const d = dueRange.to instanceof Date ? dueRange.to : new Date(String(dueRange.to));
      if (!Number.isNaN(d.getTime())) {
        dueBefore = d.toISOString();
      }
    }
  }

  return {
    ...currentQuery,
    keyword,
    formKey,
    status,
    businessKey,
    dueAfter,
    dueBefore,
    page: 0,
  };
}

export function extractInboxError(error: unknown): InboxErrorDetail {
  if (!error) {
    return { errorCode: 'UNKNOWN_ERROR', errorMessage: 'An unknown error occurred' };
  }

  const httpErr = error as {
    status?: number;
    error?: {
      code?: string;
      errorCode?: string;
      error_code?: string;
      message?: string;
      errorMessage?: string;
      error_message?: string;
    } | string;
    message?: string;
    statusText?: string;
  };

  const payload =
    typeof httpErr.error === 'object' && httpErr.error !== null ? httpErr.error : undefined;

  const errorCode =
    payload?.errorCode ||
    payload?.error_code ||
    payload?.code ||
    (httpErr.status ? `HTTP_${httpErr.status}` : 'UNKNOWN_ERROR');

  const errorMessage =
    payload?.errorMessage ||
    payload?.error_message ||
    payload?.message ||
    (typeof httpErr.error === 'string' && httpErr.error ? httpErr.error : '') ||
    httpErr.message ||
    httpErr.statusText ||
    'Failed to load tasks';

  return {
    errorCode: String(errorCode),
    errorMessage: String(errorMessage),
  };
}
