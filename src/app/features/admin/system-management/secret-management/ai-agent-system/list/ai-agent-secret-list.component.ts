import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../../core/constants/system.constants';
import { AiAgentSecretResponse } from '../../../../../../core/models/ai-agent/ai-agent-secret.model';
import { AiAgentSecretService } from '../../../../../../core/services/ai-agent-service/ai-agent-secret.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../../shared/ui/table/models/table-config.model';
import { AI_AGENT_SECRET_ROUTES } from '../ai-agent-secret.constants';

@Component({
  selector: 'app-ai-agent-secret-list',
  standalone: false,
  templateUrl: './ai-agent-secret-list.component.html'
})
export class AiAgentSecretListComponent extends BasePagedList<AiAgentSecretResponse> implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'systemManagement.aiAgentSecret.list.title',
    stateKey: 'system-management.ai-agent-secrets',
    emptyTitle: 'shared.table.emptyTitle',
    emptyDescription: 'shared.table.emptyDescription',
    errorTitle: 'loadError',
    toolbar: {
      new: { visible: true, label: 'systemManagement.action.newSecret', icon: 'pi pi-plus', severity: 'success' },
      columnVisibility: { visible: true },
      density: { visible: true }
    },
    filters: [
      { field: 'code', label: 'code', placeholder: 'systemManagement.filter.searchCode' },
      { field: 'category', label: 'category', placeholder: 'systemManagement.filter.searchCategory' }
    ],
    filterOptions: { primaryField: 'code' },
    columns: [
      { field: 'category', header: 'category', sortable: true },
      { field: 'name', header: 'name', sortable: true },
      { field: 'code', header: 'code', type: 'copyable', sortable: true },
      { field: 'enabled', header: 'enabled', type: 'boolean' },
      {
        field: 'status',
        header: 'status',
        type: 'badge',
        badgeMap: { ACTIVE: 'success', INACTIVE: 'muted', DELETE: 'danger' }
      },
      { field: 'description', header: 'description' },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        minWidth: '12rem',
        frozen: true,
        alignFrozen: 'right',
        actions: [
          { label: 'edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row) => this.goEdit(row.id) },
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
    private readonly service: AiAgentSecretService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {
    super(route, router, DEFAULT_TABLE_ROWS, ['category,asc', 'code,asc']);
  }

  ngOnInit(): void {
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate([AI_AGENT_SECRET_ROUTES.create]);
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${AI_AGENT_SECRET_ROUTES.list}/edit`, id]);
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
      errorMessage: 'systemManagement.aiAgentSecret.toast.loadListFailed',
      onError: () => this.toastService.error('systemManagement.aiAgentSecret.toast.loadListFailed')
    });
  }
}
