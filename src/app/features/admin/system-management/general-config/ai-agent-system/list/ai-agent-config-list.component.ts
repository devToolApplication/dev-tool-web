import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../../core/constants/system.constants';
import { AiAgentConfigResponse } from '../../../../../../core/models/ai-agent/ai-agent-config.model';
import { BasePageResponse } from '../../../../../../core/models/base-response.model';
import { AiAgentConfigService } from '../../../../../../core/services/ai-agent-service/ai-agent-config.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../../shared/ui/table/models/table-config.model';
import { AI_AGENT_CONFIG_ROUTES } from '../ai-agent-config.constants';

@Component({
  selector: 'app-ai-agent-config-list',
  standalone: false,
  templateUrl: './ai-agent-config-list.component.html'
})
export class AiAgentConfigListComponent extends BasePagedList<AiAgentConfigResponse> implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'AI Agent Configs',
    toolbar: { new: { visible: true, label: 'New Config', icon: 'pi pi-plus', severity: 'success' } },
    filters: [
      { field: 'key', label: 'Key', placeholder: 'Search key' },
      { field: 'category', label: 'Category', placeholder: 'Search category' }
    ],
    filterOptions: { primaryField: 'key' },
    columns: [
      { field: 'category', header: 'Category', sortable: true },
      { field: 'key', header: 'Key', sortable: true },
      { field: 'status', header: 'Status' },
      { field: 'description', header: 'Description' },
      {
        field: 'actions',
        header: 'Actions',
        type: 'actions',
        actions: [
          { label: 'Edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row) => this.goEdit(row.id) },
          { label: 'Delete', icon: 'pi pi-trash', severity: 'danger', onClick: (row) => this.remove(row.id) }
        ]
      }
    ],
    pagination: true,
    rows: DEFAULT_TABLE_ROWS,
    rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
  };

  loading = false;

  constructor(
    private readonly service: AiAgentConfigService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly i18nService: I18nService
  ) {
    super(route, router, DEFAULT_TABLE_ROWS);
  }

  ngOnInit(): void {
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate([AI_AGENT_CONFIG_ROUTES.create]);
  }

  private goEdit(id: string): void {
    void this.router.navigate([`${AI_AGENT_CONFIG_ROUTES.list}/edit`, id]);
  }

  private remove(id: string): void {
    this.loading = true;
    this.loadingService.track(this.service.delete(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.info(this.i18nService.t('deleteSuccess'));
        this.loadPage();
      },
      error: () => this.toastService.error(this.i18nService.t('deleteError'))
    });
  }

  protected loadPage(): void {
    this.loading = true;
    this.loadingService
      .track(this.service.getPage(this.page, this.pageSize, ['category,asc', 'key,asc'], this.filters))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: BasePageResponse<AiAgentConfigResponse>) => this.setPageResponse(res),
        error: () => this.toastService.error('Load AI Agent configs failed')
      });
  }
}
