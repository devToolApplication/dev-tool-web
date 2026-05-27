import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { AiAgentCrawlerConfigResponse } from '../../../../../core/models/ai-agent/ai-agent-crawler.model';
import { AiAgentCrawlerConfigService } from '../../../../../core/services/ai-agent-service/ai-agent-crawler.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { AI_AGENT_CRAWLER_ROUTES } from '../ai-agent-crawler.constants';

@Component({
  selector: 'app-ai-agent-crawler-list',
  standalone: false,
  templateUrl: './ai-agent-crawler-list.component.html'
})
export class AiAgentCrawlerListComponent extends BasePagedList<AiAgentCrawlerConfigResponse> implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'systemManagement.aiAgentCrawler.list.title',
    stateKey: 'system-management.ai-agent-crawlers',
    emptyTitle: 'shared.table.emptyTitle',
    emptyDescription: 'shared.table.emptyDescription',
    errorTitle: 'loadError',
    toolbar: {
      new: { visible: true, label: 'systemManagement.action.newCrawler', icon: 'pi pi-plus', severity: 'success' },
      columnVisibility: { visible: true },
      density: { visible: true }
    },
    filters: [
      {
        field: 'crawlerType',
        label: 'crawlerType',
        type: 'select',
        placeholder: 'systemManagement.filter.searchCrawlerType',
        options: [
          { label: 'WEB', value: 'WEB' },
          { label: 'FILE', value: 'FILE' },
          { label: 'ACTION_RESPONSE', value: 'ACTION_RESPONSE' }
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
    filterOptions: { primaryField: 'crawlerType' },
    columns: [
      { field: 'name', header: 'name', sortable: true },
      { field: 'crawlerType', header: 'systemManagement.field.crawlerType', sortable: true },
      { field: 'timeoutSeconds', header: 'systemManagement.field.timeoutSeconds', sortable: true },
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
    private readonly service: AiAgentCrawlerConfigService,
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
    void this.router.navigate([AI_AGENT_CRAWLER_ROUTES.create]);
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${AI_AGENT_CRAWLER_ROUTES.list}/edit`, id]);
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
      errorMessage: 'systemManagement.aiAgentCrawler.toast.loadListFailed',
      onError: () => this.toastService.error('systemManagement.aiAgentCrawler.toast.loadListFailed')
    });
  }
}
