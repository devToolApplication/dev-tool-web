import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { AgentAccountResponse } from '../../../../../core/models/ai-agent/ai-agent-account.model';
import { AiAgentAccountService } from '../../../../../core/services/ai-agent-service/ai-agent-account.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { AI_AGENT_ACCOUNT_ROUTES } from '../ai-agent-account.constants';

@Component({
  selector: 'app-ai-agent-account-list',
  standalone: false,
  templateUrl: './ai-agent-account-list.component.html'
})
export class AiAgentAccountListComponent extends BasePagedList<AgentAccountResponse> implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'systemManagement.agentAccount.list.title',
    stateKey: 'system-management.ai-agent-accounts',
    emptyTitle: 'shared.table.emptyTitle',
    emptyDescription: 'shared.table.emptyDescription',
    errorTitle: 'loadError',
    toolbar: {
      new: { visible: true, label: 'systemManagement.action.newAccount', icon: 'pi pi-plus', severity: 'success' },
      columnVisibility: { visible: true },
      density: { visible: true }
    },
    filters: [
      {
        field: 'provider',
        label: 'provider',
        type: 'select',
        placeholder: 'systemManagement.filter.searchProvider',
        options: [
          { label: 'Codex', value: 'codex' },
          { label: 'Claude', value: 'claude' },
          { label: 'Antigravity', value: 'antigravity' }
        ]
      },
      {
        field: 'enabled',
        label: 'status',
        type: 'select',
        placeholder: 'systemManagement.filter.searchStatus',
        options: [
          { label: 'Enabled', value: 'true' },
          { label: 'Disabled', value: 'false' }
        ]
      }
    ],
    filterOptions: { primaryField: 'provider' },
    columns: [
      { field: 'code', header: 'code', sortable: true },
      { field: 'name', header: 'name', sortable: true },
      {
        field: 'provider',
        header: 'provider',
        type: 'badge',
        badgeMap: { codex: 'info', claude: 'warning', antigravity: 'muted' }
      },
      {
        field: 'enabled',
        header: 'status',
        type: 'badge',
        badgeMap: { true: 'success', false: 'danger' }
      },
      { field: 'lastUsedAt', header: 'systemManagement.field.lastUsedAt', type: 'date' },
      { field: 'rateLimitReachedAt', header: 'systemManagement.field.rateLimitReachedAt', type: 'date' },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        minWidth: '16rem',
        frozen: true,
        alignFrozen: 'right',
        actions: [
          { label: 'edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row) => this.goEdit(row.id) },
          { label: 'login', icon: 'pi pi-sign-in', severity: 'warn', onClick: (row) => this.doLogin(row) },
          {
            label: 'clearRateLimit',
            icon: 'pi pi-refresh',
            severity: 'secondary',
            visible: (row) => !!row.rateLimitReachedAt,
            onClick: (row) => this.doClearRateLimit(row.id)
          },
          {
            label: 'delete',
            icon: 'pi pi-trash',
            severity: 'danger',
            variant: 'danger',
            confirm: { message: 'shared.confirm.dangerAction', variant: 'danger' },
            onClick: (row) => this.remove(row.id)
          }
        ]
      }
    ],
    pagination: true,
    rows: DEFAULT_TABLE_ROWS,
    rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
  };

  constructor(
    private readonly service: AiAgentAccountService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {
    super(route, router, DEFAULT_TABLE_ROWS, ['code,asc']);
  }

  ngOnInit(): void {
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate([AI_AGENT_ACCOUNT_ROUTES.create]);
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${AI_AGENT_ACCOUNT_ROUTES.list}/edit`, id]);
  }

  private doLogin(row: AgentAccountResponse): void {
    this.loadingService.track(this.service.startLogin(row.id)).subscribe({
      next: (session) => {
        if (session.verificationUri) {
          window.open(session.verificationUri, '_blank');
          this.toastService.info(
            `${this.i18nService.t('systemManagement.agentAccount.toast.loginStarted')} Code: ${session.userCode || 'N/A'}`
          );
        } else {
          this.toastService.info(this.i18nService.t('systemManagement.agentAccount.toast.loginPending'));
        }
        this.pollLogin(row.id, session.sessionId);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || err?.message || this.i18nService.t('systemManagement.agentAccount.toast.loginError');
        this.toastService.error(errorMsg);
      }
    });
  }

  private pollLogin(accountId: string, sessionId: string): void {
    const interval = setInterval(() => {
      this.service.pollLoginStatus(accountId, sessionId).subscribe({
        next: (session) => {
          if (session.state === 'authenticated') {
            clearInterval(interval);
            this.toastService.info(this.i18nService.t('systemManagement.agentAccount.toast.loginSuccess'));
            this.loadPage();
          } else if (session.state === 'failed' || session.state === 'expired') {
            clearInterval(interval);
            this.toastService.error(session.error || this.i18nService.t('systemManagement.agentAccount.toast.loginFailed'));
          }
        },
        error: () => clearInterval(interval)
      });
    }, 3000);

    setTimeout(() => clearInterval(interval), 10 * 60 * 1000);
  }

  private doClearRateLimit(id: string): void {
    this.loadingService.track(this.service.clearRateLimit(id)).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t('systemManagement.agentAccount.toast.rateLimitCleared'));
        this.loadPage();
      },
      error: () => this.toastService.error(this.i18nService.t('systemManagement.agentAccount.toast.rateLimitClearError'))
    });
  }

  private remove(id: string): void {
    this.loadingService.track(this.service.delete(id)).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t('deleteSuccess'));
        this.loadPage();
      },
      error: () => this.toastService.error(this.i18nService.t('deleteError'))
    });
  }

  protected loadPage(): void {
    this.runPageRequest(this.loadingService.track(this.service.getPage(this.page, this.pageSize, this.sorts, this.filters)), {
      errorMessage: 'systemManagement.agentAccount.toast.loadListFailed',
      onError: () => this.toastService.error('systemManagement.agentAccount.toast.loadListFailed')
    });
  }
}
