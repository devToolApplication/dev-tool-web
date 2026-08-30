import type { ParamMap, Params } from '@angular/router';
import type {
  TableAction,
  TableBulkAction,
  TableConfig,
  TableFilterOption,
} from '@shared/ui/patterns/table/models/table-config.model';
import type { SelectOption } from '@shared/ui/primitives/select/select';
import type {
  KocBusinessDecision,
  KocExecutionStatus,
} from './koc-common.model';
import type {
  KocCandidateListQuery,
  KocCandidateSummary,
} from './koc-candidate.model';

const CANDIDATE_DECISIONS: KocBusinessDecision[] = [
  'WAITING',
  'ACCEPTED',
  'REJECTED',
  'REVIEW',
  'SCREENING',
];

const CANDIDATE_EXECUTION_STATUSES: KocExecutionStatus[] = [
  'DISCOVERED',
  'ENRICHING',
  'READY_FOR_SCREENING',
  'SCREENING_QUEUED',
  'SCREENING_RUNNING',
  'MANUAL_REVIEW',
  'PENDING',
  'RUNNING',
  'WAITING',
  'WAITING_DEPENDENCY',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'ERROR',
];

export function candidateDecisionI18nKey(decision: KocBusinessDecision): string {
  return `koc.candidate.status.${decision.toLowerCase()}`;
}

export function candidateExecutionStatusI18nKey(status: KocExecutionStatus): string {
  switch (status) {
    case 'READY_FOR_SCREENING':
      return 'koc.execution.status.readyForScreening';
    case 'SCREENING_QUEUED':
      return 'koc.execution.status.screeningQueued';
    case 'SCREENING_RUNNING':
      return 'koc.execution.status.screeningRunning';
    case 'MANUAL_REVIEW':
      return 'koc.execution.status.manualReview';
    case 'WAITING_DEPENDENCY':
      return 'koc.execution.status.waitingDependency';
    default:
      return `koc.execution.status.${status.toLowerCase()}`;
  }
}

export const KOC_CANDIDATE_DECISION_OPTIONS: SelectOption[] = [
  { label: 'koc.candidates.filter.allDecisions', value: null },
  ...CANDIDATE_DECISIONS.map((decision) => ({
    label: candidateDecisionI18nKey(decision),
    value: decision,
  })),
];

export const KOC_CANDIDATE_EXECUTION_STATUS_OPTIONS: SelectOption[] = [
  { label: 'koc.candidates.filter.allExecutionStatuses', value: null },
  ...CANDIDATE_EXECUTION_STATUSES.map((status) => ({
    label: candidateExecutionStatusI18nKey(status),
    value: status,
  })),
];

export function buildKocCandidateTableConfig(
  actions: TableAction<KocCandidateSummary>[] = buildKocCandidateRowActions(),
  bulkActions: TableBulkAction<KocCandidateSummary>[] = buildKocCandidateBulkActions(),
): TableConfig<KocCandidateSummary> {
  return {
    title: 'koc.candidates.table.title',
    emptyTitle: 'koc.candidates.empty.title',
    emptyDescription: 'koc.candidates.empty.description',
    emptyFilteredTitle: 'koc.candidates.empty.filteredTitle',
    emptyFilteredDescription: 'koc.candidates.empty.filteredDescription',
    errorTitle: 'koc.candidates.error.title',
    rowClickable: true,
    rowKey: 'candidateId',
    dataKey: 'candidateId',
    pagination: true,
    rows: 20,
    minWidth: '70rem',
    selection: {
      mode: 'multiple',
    },
    toolbar: {
      refresh: { visible: true, label: 'refresh', icon: 'pi pi-refresh' },
      search: {
        visible: true,
        field: 'search',
        label: 'koc.candidates.filter.search',
        placeholder: 'koc.candidates.filter.searchPlaceholder',
      },
      bulkActions,
      columnVisibility: { visible: true, label: 'fieldOptions' },
      density: { visible: true },
    },
    filters: [
      {
        field: 'decision',
        label: 'koc.candidates.filter.decision',
        type: 'select',
        options: KOC_CANDIDATE_DECISION_OPTIONS.filter(
          (option): option is TableFilterOption => option.value !== null,
        ),
        quick: true,
      },
      {
        field: 'executionStatus',
        label: 'koc.candidates.filter.executionStatus',
        type: 'select',
        options: KOC_CANDIDATE_EXECUTION_STATUS_OPTIONS.filter(
          (option): option is TableFilterOption => option.value !== null,
        ),
        quick: true,
      },
    ],
    columns: [
      {
        field: 'candidate',
        header: 'koc.candidates.column.candidate',
        type: 'text',
        minWidth: '14rem',
        valueGetter: (row) => row.displayName,
      },
      {
        field: 'campaign',
        header: 'koc.candidates.column.campaign',
        type: 'text',
        minWidth: '10rem',
        valueGetter: (row) => row.campaignId,
      },
      {
        field: 'decision',
        header: 'koc.candidates.column.decision',
        type: 'badge',
        minWidth: '8rem',
        badgeMap: {
          'koc.candidate.status.waiting': 'warning',
          'koc.candidate.status.accepted': 'success',
          'koc.candidate.status.rejected': 'danger',
          'koc.candidate.status.review': 'warning',
          'koc.candidate.status.screening': 'info',
        },
        valueGetter: (row) => candidateDecisionI18nKey(row.decision),
      },
      {
        field: 'executionStatus',
        header: 'koc.candidates.column.executionStatus',
        type: 'badge',
        minWidth: '10rem',
        badgeMap: {
          'koc.execution.status.discovered': 'muted',
          'koc.execution.status.enriching': 'info',
          'koc.execution.status.readyForScreening': 'info',
          'koc.execution.status.screeningQueued': 'muted',
          'koc.execution.status.screeningRunning': 'info',
          'koc.execution.status.manualReview': 'warning',
          'koc.execution.status.pending': 'muted',
          'koc.execution.status.waiting': 'muted',
          'koc.execution.status.waitingDependency': 'muted',
          'koc.execution.status.running': 'info',
          'koc.execution.status.completed': 'success',
          'koc.execution.status.failed': 'danger',
          'koc.execution.status.cancelled': 'muted',
          'koc.execution.status.error': 'danger',
        },
        valueGetter: (row) => candidateExecutionStatusI18nKey(row.executionStatus),
      },
      {
        field: 'followers',
        header: 'koc.candidates.column.followers',
        type: 'number',
        align: 'right',
        minWidth: '8rem',
        valueGetter: (row) => row.followers ?? 0,
      },
      {
        field: 'screeningProgress',
        header: 'koc.candidates.column.progress',
        type: 'text',
        align: 'right',
        minWidth: '8rem',
        valueGetter: (row) =>
          row.screeningProgress !== undefined
            ? `${row.screeningProgress}%`
            : '-',
      },
      {
        field: 'updatedAt',
        header: 'koc.candidates.column.updatedAt',
        type: 'datetime',
        minWidth: '12rem',
      },
      {
        field: 'actions',
        header: 'koc.candidates.column.actions',
        type: 'actions',
        align: 'right',
        hideable: false,
        width: '8rem',
        actions,
      },
    ],
  };
}

export function buildKocCandidateRowActions(
  onOpen: (row: KocCandidateSummary) => void = () => undefined,
): TableAction<KocCandidateSummary>[] {
  return [
    {
      id: 'open',
      label: 'koc.candidates.action.open',
      icon: 'pi pi-external-link',
      placement: 'primary',
      variant: 'ghost',
      onClick: (row) => onOpen(row),
    },
  ];
}

export function buildKocCandidateBulkActions(
  onBulkAction: (actionId: string, rows: KocCandidateSummary[]) => void = () => undefined,
): TableBulkAction<KocCandidateSummary>[] {
  return [
    {
      id: 'bulk-approve',
      label: 'koc.candidates.bulk.approve',
      icon: 'pi pi-check',
      variant: 'primary',
      onClick: (rows) => onBulkAction('bulk-approve', rows),
    },
    {
      id: 'bulk-reject',
      label: 'koc.candidates.bulk.reject',
      icon: 'pi pi-times',
      variant: 'danger',
      onClick: (rows) => onBulkAction('bulk-reject', rows),
    },
  ];
}

export function isSameCampaignSelection(rows: KocCandidateSummary[]): boolean {
  if (!rows || rows.length === 0) {
    return false;
  }
  const firstCampaignId = rows[0].campaignId;
  return rows.every((row) => row.campaignId === firstCampaignId);
}

export function validateRejectReasonLength(reason?: string | null): boolean {
  return (reason?.length ?? 0) <= 500;
}

export function prepareBulkRejectReason(reason?: string | null): string | undefined {
  const trimmed = reason?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function parseKocCandidateListQuery(
  query: Pick<ParamMap, 'get'>,
): KocCandidateListQuery {
  const campaignId = cleanString(query.get('campaignId'));
  const search = cleanString(query.get('search'));
  const decision = normalizeCandidateDecision(query.get('decision'));
  const executionStatus = normalizeCandidateExecutionStatus(
    query.get('executionStatus'),
  );
  const page = parsePositiveNumber(query.get('page'));
  const size = parsePositiveNumber(query.get('size'));

  return {
    ...(campaignId ? { campaignId } : {}),
    ...(search ? { search } : {}),
    ...(decision ? { decision } : {}),
    ...(executionStatus ? { executionStatus } : {}),
    ...(page !== undefined ? { page } : {}),
    ...(size !== undefined ? { size } : {}),
  };
}

export function serializeKocCandidateListQuery(
  query: KocCandidateListQuery,
): Params {
  const search = cleanString(query.search);
  const campaignId = cleanString(query.campaignId);

  return {
    ...(campaignId ? { campaignId } : {}),
    ...(search ? { search } : {}),
    ...(query.decision ? { decision: query.decision } : {}),
    ...(query.executionStatus
      ? { executionStatus: query.executionStatus }
      : {}),
    ...(query.page !== undefined ? { page: query.page } : {}),
    ...(query.size !== undefined ? { size: query.size } : {}),
  };
}

function normalizeCandidateDecision(
  value: string | null,
): KocBusinessDecision | undefined {
  return CANDIDATE_DECISIONS.includes(value as KocBusinessDecision)
    ? (value as KocBusinessDecision)
    : undefined;
}

function normalizeCandidateExecutionStatus(
  value: string | null,
): KocExecutionStatus | undefined {
  return CANDIDATE_EXECUTION_STATUSES.includes(value as KocExecutionStatus)
    ? (value as KocExecutionStatus)
    : undefined;
}

function cleanString(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parsePositiveNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}
