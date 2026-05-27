import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { AiAgentAgentConfigResponse } from '../../../../../core/models/ai-agent/ai-agent-catalog.model';
import { AiAgentAgentConfigService } from '../../../../../core/services/ai-agent-service/ai-agent-catalog.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { AI_AGENT_CATALOG_ROUTES } from '../ai-agent-catalog.constants';

@Component({
  selector: 'app-ai-agent-catalog-list',
  standalone: false,
  templateUrl: './ai-agent-catalog-list.component.html'
})
export class AiAgentCatalogListComponent extends BasePagedList<AiAgentAgentConfigResponse> implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'systemManagement.aiAgentCatalog.list.title',
    stateKey: 'system-management.ai-agents',
    emptyTitle: 'shared.table.emptyTitle',
    emptyDescription: 'shared.table.emptyDescription',
    errorTitle: 'loadError',
    toolbar: {
      new: { visible: true, label: 'systemManagement.action.newAgent', icon: 'pi pi-plus', severity: 'success' },
      columnVisibility: { visible: true },
      density: { visible: true }
    },
    filters: [
      {
        field: 'roleType',
        label: 'roleType',
        type: 'select',
        placeholder: 'systemManagement.filter.searchRoleType',
        options: [
          { label: 'CUSTOM', value: 'CUSTOM' },
          { label: 'BA', value: 'BA' },
          { label: 'DEV', value: 'DEV' },
          { label: 'REVIEW', value: 'REVIEW' },
          { label: 'QA', value: 'QA' },
          { label: 'SYSTEM', value: 'SYSTEM' }
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
    filterOptions: { primaryField: 'roleType' },
    columns: [
      { field: 'name', header: 'name', sortable: true },
      { field: 'roleType', header: 'systemManagement.field.roleType', sortable: true },
      { field: 'customRoleType', header: 'systemManagement.field.customRoleType' },
      { field: 'modelName', header: 'systemManagement.field.modelName' },
      {
        field: 'status',
        header: 'status',
        type: 'badge',
        badgeMap: { ENABLED: 'success', DISABLED: 'danger' }
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
    private readonly service: AiAgentAgentConfigService,
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
    void this.router.navigate([AI_AGENT_CATALOG_ROUTES.create]);
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${AI_AGENT_CATALOG_ROUTES.list}/edit`, id]);
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
      errorMessage: 'systemManagement.aiAgentCatalog.toast.loadListFailed',
      onError: () => this.toastService.error('systemManagement.aiAgentCatalog.toast.loadListFailed')
    });
  }
}
