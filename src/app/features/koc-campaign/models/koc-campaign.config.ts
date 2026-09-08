import type { ActionToolbarAction } from '@shared/ui/layout/action-toolbar/action-toolbar.component';
import type { FilterPanelField } from '@shared/ui/layout/filter-panel/filter-panel.component';
import type { KeyValueItem } from '@shared/ui/data-display/key-value-list/key-value-list.component';
import type { TableConfig } from '@shared/ui/patterns/table/models/table-config.model';
import { KocCampaignItem, KocCandidateItem, KocCandidateApprovalItem } from './koc-campaign.model';

export function buildKocCampaignListActions(): ActionToolbarAction[] {
  return [
    {
      id: 'create',
      label: 'kocCampaign.action.create',
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

export function buildKocCampaignFilterFields(): FilterPanelField[] {
  return [
    {
      key: 'keyword',
      label: 'kocCampaign.filter.keyword',
      type: 'text',
      placeholder: 'kocCampaign.filter.keywordPlaceholder',
    },
    {
      key: 'niche',
      label: 'kocCampaign.filter.niche',
      type: 'select',
      options: [
        { label: 'kocCampaign.filter.allNiches', value: '' },
        { label: 'Công nghệ (TECH)', value: 'TECH' },
        { label: 'Làm đẹp & Mỹ phẩm (BEAUTY)', value: 'BEAUTY' },
        { label: 'Thời trang (FASHION)', value: 'FASHION' },
        { label: 'Đời sống (LIFESTYLE)', value: 'LIFESTYLE' },
        { label: 'Ẩm thực (FOOD)', value: 'FOOD' },
        { label: 'Sức khỏe (FITNESS)', value: 'FITNESS' },
        { label: 'Du lịch (TRAVEL)', value: 'TRAVEL' },
      ],
    },
    {
      key: 'workflowStatus',
      label: 'kocCampaign.filter.workflowStatus',
      type: 'select',
      options: [
        { label: 'kocCampaign.filter.allWorkflowStatuses', value: '' },
        { label: 'kocCampaign.status.running', value: 'RUNNING' },
        { label: 'kocCampaign.status.userTask', value: 'USER_TASK' },
        { label: 'kocCampaign.status.completed', value: 'COMPLETED' },
        { label: 'kocCampaign.status.failed', value: 'FAILED' },
      ],
    },
  ];
}

export function buildKocCampaignTableConfig(): TableConfig<KocCampaignItem> {
  return {
    rowClickable: true,
    emptyTitle: 'kocCampaign.empty.title',
    emptyDescription: 'kocCampaign.empty.description',
    columns: [
      {
        field: 'name',
        header: 'kocCampaign.column.name',
        type: 'custom',
        minWidth: '16rem',
      },
      {
        field: 'niche',
        header: 'kocCampaign.column.niche',
        type: 'badge',
        width: '9rem',
        badgeMap: {
          TECH: 'info',
          BEAUTY: 'warning',
          FASHION: 'default',
          LIFESTYLE: 'success',
          FOOD: 'warning',
          FITNESS: 'success',
          TRAVEL: 'info',
        },
      },
      {
        field: 'targetCount',
        header: 'kocCampaign.column.targets',
        type: 'custom',
        width: '11rem',
      },
      {
        field: 'workflowStatus',
        header: 'kocCampaign.column.workflowStatus',
        type: 'custom',
        minWidth: '13rem',
      },
      {
        field: 'approvedKocCount',
        header: 'kocCampaign.column.approvedKocs',
        type: 'custom',
        width: '9rem',
      },
      {
        field: 'createdAt',
        header: 'kocCampaign.column.createdAt',
        type: 'date',
        width: '10rem',
      },
      {
        field: 'actions',
        header: 'kocCampaign.column.actions',
        type: 'actions',
        width: '10rem',
        align: 'right',
        frozen: true,
        alignFrozen: 'right',
        actions: [
          {
            id: 'viewCandidates',
            label: 'kocCampaign.action.viewCandidates',
            icon: 'pi pi-users',
            variant: 'ghost',
            onClick: () => undefined,
          },
          {
            id: 'approveTask',
            label: 'kocCampaign.action.approveTask',
            icon: 'pi pi-user-check',
            variant: 'primary',
            onClick: () => undefined,
          },
          {
            id: 'edit',
            label: 'kocCampaign.action.edit',
            icon: 'pi pi-pencil',
            variant: 'ghost',
            placement: 'more',
            onClick: () => undefined,
          },
          {
            id: 'clone',
            label: 'kocCampaign.action.clone',
            icon: 'pi pi-copy',
            variant: 'ghost',
            placement: 'more',
            onClick: () => undefined,
          },
          {
            id: 'delete',
            label: 'kocCampaign.action.delete',
            icon: 'pi pi-trash',
            variant: 'danger',
            placement: 'more',
            onClick: () => undefined,
          },
        ],
      },
    ],
  };
}

export function buildKocCandidateTableConfig(): TableConfig<KocCandidateItem> {
  return {
    emptyTitle: 'kocCampaign.drawer.emptyKocs',
    emptyDescription: '',
    columns: [
      {
        field: 'fullName',
        header: 'kocCandidate.column.fullName',
        type: 'custom',
        minWidth: '13rem',
      },
      {
        field: 'platform',
        header: 'kocCandidate.column.platform',
        type: 'badge',
        width: '8rem',
        badgeMap: {
          FACEBOOK: 'info',
          TIKTOK: 'default',
          INSTAGRAM: 'warning',
          YOUTUBE: 'danger',
        },
      },
      {
        field: 'followerCount',
        header: 'kocCandidate.column.followers',
        type: 'custom',
        width: '8rem',
      },
      {
        field: 'score',
        header: 'kocCandidate.column.score',
        type: 'custom',
        width: '7rem',
      },
      {
        field: 'profileUrl',
        header: 'kocCandidate.column.profileUrl',
        type: 'custom',
        minWidth: '12rem',
      },
      {
        field: 'createdAt',
        header: 'kocCandidate.column.approvedAt',
        type: 'date',
        width: '9rem',
      },
    ],
  };
}

export function buildKocCandidateApprovalTableConfig(): TableConfig<KocCandidateApprovalItem> {
  return {
    emptyTitle: 'kocApproval.emptyTasks.title',
    emptyDescription: 'kocApproval.emptyTasks.description',
    columns: [
      {
        field: 'selected',
        header: 'kocApproval.candidate.select',
        type: 'custom',
        width: '4rem',
      },
      {
        field: 'fullName',
        header: 'kocApproval.candidate.fullName',
        type: 'custom',
        minWidth: '13rem',
      },
      {
        field: 'followerCount',
        header: 'kocApproval.candidate.followers',
        type: 'custom',
        width: '8rem',
      },
      {
        field: 'score',
        header: 'kocApproval.candidate.score',
        type: 'custom',
        width: '7rem',
      },
      {
        field: 'profileUrl',
        header: 'kocApproval.candidate.profileUrl',
        type: 'custom',
        minWidth: '12rem',
      },
      {
        field: 'analysis',
        header: 'kocApproval.candidate.analysis',
        type: 'custom',
        minWidth: '16rem',
      },
    ],
  };
}

export function kocCampaignDetailItems(campaign: KocCampaignItem): KeyValueItem[] {
  return [
    { label: 'kocCampaign.form.name', value: campaign.name },
    { label: 'kocCampaign.form.niche', value: campaign.niche || '-' },
    { label: 'kocCampaign.column.workflowStatus', value: campaign.workflowStatus || '-' },
    { label: 'kocCampaign.column.approvedKocs', value: `${campaign.approvedKocCount ?? 0} / ${campaign.targetCount ?? 0}` },
    { label: 'kocCampaign.form.minScore', value: campaign.minScore ? `${campaign.minScore}/100` : '-' },
    { label: 'Workflow Run ID', value: campaign.workflowRunId || '-', copyable: !!campaign.workflowRunId },
    { label: 'kocCampaign.column.createdAt', value: campaign.createdAt || '-' },
  ];
}
