import type { ParamMap, Params } from '@angular/router';
import type {
  TableAction,
  TableConfig,
  TableFilterOption,
} from '@shared/ui/patterns/table/models/table-config.model';
import type { SelectOption } from '@shared/ui/primitives/select/select';
import type { KocCampaignListQuery, KocCampaignStatus, KocCampaignSummary } from './koc-campaign.model';

const CAMPAIGN_STATUSES: KocCampaignStatus[] = [
  'DRAFT',
  'READY',
  'RUNNING',
  'PAUSED',
  'COMPLETED',
  'STOPPED',
  'BLOCKED',
];

export const KOC_CAMPAIGN_STATUS_OPTIONS: SelectOption[] = [
  { label: 'koc.campaigns.filter.statusAll', value: null },
  ...CAMPAIGN_STATUSES.map((status) => ({
    label: `koc.campaign.status.${status.toLowerCase()}`,
    value: status,
  })),
];

export function buildKocCampaignTableConfig(
  actions: TableAction<KocCampaignSummary>[] = buildKocCampaignRowActions(),
): TableConfig<KocCampaignSummary> {
  return {
    title: 'koc.campaigns.table.title',
    emptyTitle: 'koc.campaigns.empty.title',
    emptyDescription: 'koc.campaigns.empty.description',
    emptyFilteredTitle: 'koc.campaigns.empty.filteredTitle',
    emptyFilteredDescription: 'koc.campaigns.empty.filteredDescription',
    errorTitle: 'koc.campaigns.error.title',
    rowClickable: true,
    rowKey: 'campaignId',
    dataKey: 'campaignId',
    pagination: true,
    rows: 20,
    minWidth: '70rem',
    toolbar: {
      refresh: { visible: true, label: 'refresh', icon: 'pi pi-refresh' },
      search: {
        visible: true,
        field: 'search',
        label: 'koc.campaigns.filter.search',
        placeholder: 'koc.campaigns.filter.searchPlaceholder',
      },
      columnVisibility: { visible: true, label: 'fieldOptions' },
      density: { visible: true },
    },
    filters: [
      {
        field: 'status',
        label: 'koc.campaigns.filter.status',
        type: 'select',
        options: KOC_CAMPAIGN_STATUS_OPTIONS.filter((option): option is TableFilterOption => option.value !== null),
        quick: true,
      },
    ],
    columns: [
      {
        field: 'campaign',
        header: 'koc.campaigns.column.campaign',
        type: 'text',
        minWidth: '16rem',
        valueGetter: (row) => `${row.name} (${row.code})`,
      },
      {
        field: 'status',
        header: 'koc.campaigns.column.status',
        type: 'badge',
        minWidth: '8rem',
        badgeMap: {
          'koc.campaign.status.draft': 'muted',
          'koc.campaign.status.ready': 'info',
          'koc.campaign.status.running': 'success',
          'koc.campaign.status.paused': 'warning',
          'koc.campaign.status.completed': 'success',
          'koc.campaign.status.stopped': 'muted',
          'koc.campaign.status.blocked': 'danger',
        },
        valueGetter: (row) => campaignStatusLabel(row.status),
      },
      {
        field: 'progress',
        header: 'koc.campaigns.column.progress',
        type: 'text',
        minWidth: '9rem',
        valueGetter: (row) => `${row.counters.accepted}/${row.acceptedTarget}`,
      },
      {
        field: 'discovered',
        header: 'koc.campaigns.column.discovered',
        type: 'number',
        align: 'right',
        valueGetter: (row) => row.counters.discovered,
      },
      {
        field: 'screened',
        header: 'koc.campaigns.column.screened',
        type: 'number',
        align: 'right',
        valueGetter: (row) => row.counters.screened,
      },
      {
        field: 'waiting',
        header: 'koc.campaigns.column.waiting',
        type: 'number',
        align: 'right',
        valueGetter: (row) => row.counters.waiting,
      },
      {
        field: 'lastActivityAt',
        header: 'koc.campaigns.column.lastActivity',
        type: 'datetime',
        minWidth: '12rem',
      },
      {
        field: 'actions',
        header: 'koc.campaigns.column.actions',
        type: 'actions',
        align: 'right',
        hideable: false,
        width: '8rem',
        actions,
      },
    ],
  };
}

export function buildKocCampaignRowActions(
  onAction: (actionId: string, row: KocCampaignSummary) => void = () => undefined,
): TableAction<KocCampaignSummary>[] {
  return [
    action('open', 'koc.campaigns.action.open', 'pi pi-external-link', 'primary', onAction),
    {
      ...action('edit', 'koc.campaigns.action.edit', 'pi pi-pencil', 'more', onAction),
      visible: (row) => row.status === 'DRAFT' || row.status === 'READY',
    },
    {
      ...action('start', 'koc.campaigns.action.start', 'pi pi-play', 'more', onAction),
      visible: (row) => row.status === 'DRAFT' || row.status === 'READY',
    },
    {
      ...action('pause', 'koc.campaigns.action.pause', 'pi pi-pause', 'more', onAction),
      visible: (row) => row.status === 'RUNNING',
    },
    {
      ...action('resume', 'koc.campaigns.action.resume', 'pi pi-play', 'more', onAction),
      visible: (row) => row.status === 'PAUSED',
    },
    action('clone', 'koc.campaigns.action.clone', 'pi pi-copy', 'more', onAction),
    {
      ...action('stop', 'koc.campaigns.action.stop', 'pi pi-stop', 'more', onAction, 'danger'),
      visible: (row) => row.status === 'READY' || row.status === 'RUNNING' || row.status === 'PAUSED' || row.status === 'BLOCKED',
    },
  ];
}

export function parseKocCampaignListQuery(query: Pick<ParamMap, 'get'>): KocCampaignListQuery {
  const search = cleanString(query.get('search'));
  const status = normalizeCampaignStatus(query.get('status'));
  const page = parsePositiveNumber(query.get('page'));
  const size = parsePositiveNumber(query.get('size'));

  return {
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    ...(page !== undefined ? { page } : {}),
    ...(size !== undefined ? { size } : {}),
  };
}

export function serializeKocCampaignListQuery(query: KocCampaignListQuery): Params {
  const search = cleanString(query.search);

  return {
    ...(search ? { search } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.page !== undefined ? { page: query.page } : {}),
    ...(query.size !== undefined ? { size: query.size } : {}),
  };
}

function action(
  id: string,
  label: string,
  icon: string,
  placement: 'primary' | 'more',
  onAction: (actionId: string, row: KocCampaignSummary) => void,
  variant: TableAction<KocCampaignSummary>['variant'] = 'ghost',
): TableAction<KocCampaignSummary> {
  return {
    id,
    label,
    icon,
    placement,
    variant,
    onClick: (row) => onAction(id, row),
  };
}

function normalizeCampaignStatus(value: string | null): KocCampaignStatus | undefined {
  return CAMPAIGN_STATUSES.includes(value as KocCampaignStatus) ? value as KocCampaignStatus : undefined;
}

function campaignStatusLabel(status: KocCampaignStatus): string {
  return `koc.campaign.status.${status.toLowerCase()}`;
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
