import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE, SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
import { StrategyResponse } from '../../../../../core/models/trade-bot/reference-data.model';
import { StrategyConfigService } from '../../../../../core/services/trade-bot-service/strategy-config.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { STRATEGY_CONFIG_ROUTES } from '../strategy-config.constants';

@Component({
  selector: 'app-strategy-config-list',
  standalone: false,
  templateUrl: './strategy-config-list.component.html'
})
export class StrategyConfigListComponent extends BasePagedList<StrategyResponse> implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'Strategy Config',
    toolbar: { new: { visible: true, label: 'New Strategy', icon: 'pi pi-plus', severity: 'success' } },
    filters: [
      { field: 'keyword', label: 'Keyword', placeholder: 'Search by service name or name' },
      { field: 'status', label: 'Status', type: 'select', options: [...SYSTEM_STATUS_OPTIONS] }
    ],
    filterOptions: { primaryField: 'keyword' },
    columns: [
      { field: 'serviceName', header: 'Service Name', sortable: true },
      { field: 'name', header: 'Name', sortable: true },
      { field: 'version', header: 'Version', sortable: true },
      { field: 'status', header: 'Status', sortable: true },
      { field: 'description', header: 'Description', type: 'textarea' },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        actions: [
          { label: 'edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row: StrategyResponse) => this.goEdit(row.id) },
          { label: 'delete', icon: 'pi pi-trash', severity: 'danger', onClick: (row: StrategyResponse) => this.remove(row.id) }
        ]
      }
    ],
    pagination: true,
    rows: DEFAULT_TABLE_ROWS,
    rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
  };

  loading = false;

  constructor(
    private readonly service: StrategyConfigService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    super(route, router, DEFAULT_TABLE_ROWS);
  }

  ngOnInit(): void {
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate([STRATEGY_CONFIG_ROUTES.create]);
  }

  private goEdit(id: string): void {
    void this.router.navigate([STRATEGY_CONFIG_ROUTES.edit(id)]);
  }

  private remove(id: string): void {
    this.loading = true;
    this.loadingService.track(this.service.delete(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.success('Delete strategy successfully');
        this.loadPage();
      },
      error: (error) => this.toastService.error(error?.error?.errorMessage ?? 'Delete strategy failed')
    });
  }

  protected loadPage(): void {
    this.loading = true;
    this.loadingService
      .track(
        this.service.getPage(this.page, this.pageSize, ['code,asc'], {
          keyword: String(this.filters['keyword'] ?? '').trim() || undefined,
          status: String(this.filters['status'] ?? '').trim() || undefined
        })
      )
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: BasePageResponse<StrategyResponse>) => this.setPageResponse(res),
        error: () => this.toastService.error('Load strategy list failed')
      });
  }
}
