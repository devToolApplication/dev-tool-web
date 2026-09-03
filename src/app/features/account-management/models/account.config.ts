import type { ActionToolbarAction } from '@shared/ui/layout/action-toolbar/action-toolbar.component';
import type { FilterPanelField } from '@shared/ui/layout/filter-panel/filter-panel.component';
import type { KeyValueItem } from '@shared/ui/data-display/key-value-list/key-value-list.component';
import type { TableConfig } from '@shared/ui/patterns/table/models/table-config.model';
import { AccountItem } from './account.model';

export function buildAccountListActions(): ActionToolbarAction[] {
  return [
    {
      id: 'create',
      label: 'accountManagement.action.create',
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

export function buildAccountFilterFields(): FilterPanelField[] {
  return [
    {
      key: 'keyword',
      label: 'accountManagement.filter.keyword',
      type: 'text',
      placeholder: 'accountManagement.filter.keywordPlaceholder',
    },
    {
      key: 'type',
      label: 'accountManagement.filter.type',
      type: 'select',
      options: [
        { label: 'accountManagement.filter.allTypes', value: '' },
        { label: 'OpenAI / ChatGPT', value: 'OPENAI' },
        { label: 'Google', value: 'GOOGLE' },
        { label: 'Claude', value: 'CLAUDE' },
        { label: 'GitHub', value: 'GITHUB' },
        { label: 'Twitter / X', value: 'TWITTER' },
        { label: 'Custom', value: 'CUSTOM' },
      ],
    },
    {
      key: 'status',
      label: 'accountManagement.filter.status',
      type: 'select',
      options: [
        { label: 'accountManagement.filter.allStatuses', value: '' },
        { label: 'accountManagement.status.active', value: 'ACTIVE' },
        { label: 'accountManagement.status.inactive', value: 'INACTIVE' },
      ],
    },
  ];
}

export function buildAccountTableConfig(): TableConfig<AccountItem> {
  return {
    emptyTitle: 'accountManagement.empty.title',
    emptyDescription: 'accountManagement.empty.description',
    columns: [
      {
        field: 'type',
        header: 'accountManagement.column.type',
        type: 'badge',
        width: '8rem',
        badgeMap: {
          OPENAI: 'info',
          GOOGLE: 'danger',
          CLAUDE: 'warning',
          GITHUB: 'muted',
          TWITTER: 'info',
          CUSTOM: 'default',
        },
      },
      {
        field: 'name',
        header: 'accountManagement.column.nameAndUsername',
        type: 'custom',
        minWidth: '14rem',
      },
      {
        field: 'password',
        header: 'accountManagement.column.password',
        type: 'custom',
        width: '12rem',
      },
      {
        field: 'twoFactorSecret',
        header: 'accountManagement.column.twoFactor',
        type: 'custom',
        width: '14rem',
      },
      {
        field: 'status',
        header: 'accountManagement.column.status',
        type: 'badge',
        width: '8rem',
        badgeMap: {
          ACTIVE: 'success',
          INACTIVE: 'muted',
        },
      },
      {
        field: 'actions',
        header: 'accountManagement.column.actions',
        type: 'actions',
        width: '8rem',
        align: 'right',
        frozen: true,
        alignFrozen: 'right',
        actions: [
          { id: 'view', label: 'accountManagement.action.view', icon: 'pi pi-info-circle', variant: 'ghost', onClick: () => undefined },
          { id: 'edit', label: 'accountManagement.action.edit', icon: 'pi pi-pencil', variant: 'ghost', onClick: () => undefined },
          { id: 'delete', label: 'accountManagement.action.delete', icon: 'pi pi-trash', variant: 'danger', placement: 'more', onClick: () => undefined },
        ],
      },
    ],
  };
}

export function accountDetailItems(acc: AccountItem, otpCode = ''): KeyValueItem[] {
  return [
    { label: 'ID', value: acc.id },
    { label: 'accountManagement.form.name', value: acc.name },
    { label: 'accountManagement.form.type', value: acc.type },
    { label: 'accountManagement.form.username', value: acc.username, copyable: true },
    { label: 'accountManagement.form.password', value: acc.password || '-', copyable: !!acc.password },
    { label: 'accountManagement.column.twoFactor', value: otpCode || (acc.twoFactorSecret ? '...' : '-'), copyable: !!otpCode },
    { label: 'accountManagement.form.status', value: acc.status },
    { label: 'accountManagement.form.tags', value: (acc.tags || []).join(', ') || '-' },
    { label: 'accountManagement.form.note', value: acc.note || '-' },
    { label: 'createdAt', value: acc.createdAt || '-' },
  ];
}