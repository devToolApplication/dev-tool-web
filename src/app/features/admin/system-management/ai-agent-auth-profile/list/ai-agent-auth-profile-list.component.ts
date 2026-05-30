import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { AiAgentAuthProfileResponse } from '../../../../../core/models/ai-agent/ai-agent-auth-profile.model';
import { AiAgentAuthProfileService } from '../../../../../core/services/ai-agent-service/ai-agent-auth-profile.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { AI_AGENT_AUTH_PROFILE_ROUTES } from '../ai-agent-auth-profile.constants';

@Component({
  selector: 'app-ai-agent-auth-profile-list',
  standalone: false,
  templateUrl: './ai-agent-auth-profile-list.component.html'
})
export class AiAgentAuthProfileListComponent extends BasePagedList<AiAgentAuthProfileResponse> implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'systemManagement.aiAgentAuthProfile.list.title',
    stateKey: 'system-management.ai-agent-auth-profiles',
    emptyTitle: 'shared.table.emptyTitle',
    emptyDescription: 'shared.table.emptyDescription',
    errorTitle: 'loadError',
    toolbar: {
      new: { visible: true, label: 'systemManagement.action.newAuthProfile', icon: 'pi pi-plus', severity: 'success' },
      columnVisibility: { visible: true },
      density: { visible: true }
    },
    filters: [
      {
        field: 'providerCode',
        label: 'providerCode',
        type: 'select',
        placeholder: 'systemManagement.filter.searchProviderCode',
        options: [
          { label: 'CODEX', value: 'CODEX' },
          { label: 'CLAUDE', value: 'CLAUDE' },
          { label: 'ANTIGRAVITY', value: 'ANTIGRAVITY' }
        ]
      },
      {
        field: 'status',
        label: 'status',
        type: 'select',
        placeholder: 'systemManagement.filter.searchStatus',
        options: [
          { label: 'ENABLED', value: 'ENABLED' },
          { label: 'DISABLED', value: 'DISABLED' }
        ]
      }
    ],
    filterOptions: { primaryField: 'providerCode' },
    columns: [
      { field: 'name', header: 'name', sortable: true },
      { field: 'code', header: 'code', sortable: true },
      { field: 'providerCode', header: 'systemManagement.field.providerCode', sortable: true },
      {
        field: 'authMethod',
        header: 'systemManagement.field.authMethod',
        type: 'badge',
        badgeMap: { API_KEY: 'info', OAUTH_TOKEN: 'warning', SESSION_CREDENTIALS: 'muted' }
      },
      { field: 'scopeType', header: 'systemManagement.field.scopeType', sortable: true },
      {
        field: 'status',
        header: 'status',
        type: 'badge',
        badgeMap: { ENABLED: 'success', DISABLED: 'danger' }
      },
      { field: 'lastValidatedAt', header: 'systemManagement.field.lastValidatedAt', type: 'date' },
      { field: 'description', header: 'description' },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        minWidth: '14rem',
        frozen: true,
        alignFrozen: 'right',
        actions: [
          { label: 'edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row) => this.goEdit(row.id) },
          { label: 'login', icon: 'pi pi-sign-in', severity: 'warn', onClick: (row) => this.doLogin(row) },
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
    private readonly service: AiAgentAuthProfileService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {
    super(route, router, DEFAULT_TABLE_ROWS, ['name,asc']);
  }

  ngOnInit(): void {
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate([AI_AGENT_AUTH_PROFILE_ROUTES.create]);
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${AI_AGENT_AUTH_PROFILE_ROUTES.list}/edit`, id]);
  }

  private doLogin(row: AiAgentAuthProfileResponse): void {
    this.loadingService.track(this.service.login(row.code, {})).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t('systemManagement.aiAgentAuthProfile.toast.loginSuccess'));
        this.loadPage();
      },
      error: (err) => {
        const errorMsg = err?.error?.message || err?.message || this.i18nService.t('systemManagement.aiAgentAuthProfile.toast.loginError');
        this.toastService.error(errorMsg);
      }
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
      errorMessage: 'systemManagement.aiAgentAuthProfile.toast.loadListFailed',
      onError: () => this.toastService.error('systemManagement.aiAgentAuthProfile.toast.loadListFailed')
    });
  }
}
