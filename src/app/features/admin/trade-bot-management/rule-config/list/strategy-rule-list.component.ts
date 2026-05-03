import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE, SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
import { StrategyRuleResponse } from '../../../../../core/models/trade-bot/strategy-rule.model';
import { StrategyRuleService } from '../../../../../core/services/trade-bot-service/strategy-rule.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { STRATEGY_RULE_ROUTES } from '../strategy-rule.constants';

@Component({
  selector: 'app-strategy-rule-list',
  standalone: false,
  templateUrl: './strategy-rule-list.component.html'
})
export class StrategyRuleListComponent extends BasePagedList<StrategyRuleResponse> implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'Rule Config',
    toolbar: { new: { visible: true, label: 'New Rule', icon: 'pi pi-plus', severity: 'success' } },
    filters: [
      { field: 'keyword', label: 'Keyword', placeholder: 'Search by code or name' },
      { field: 'status', label: 'Status', type: 'select', options: [...SYSTEM_STATUS_OPTIONS] }
    ],
    filterOptions: { primaryField: 'keyword' },
    columns: [
      { field: 'code', header: 'Code', sortable: true },
      { field: 'name', header: 'Name', sortable: true },
      { field: 'ruleGroupCode', header: 'Rule Group', sortable: true },
      { field: 'implementationCode', header: 'Implementation', sortable: true },
      { field: 'status', header: 'Status', sortable: true },
      { field: 'configFields', header: 'Config Fields', type: 'textarea', minWidth: '22rem' },
      { field: 'initialValue', header: 'Initial Value', type: 'textarea', minWidth: '18rem' },
      { field: 'configJson', header: 'Rule Config', type: 'textarea', minWidth: '18rem' },
      { field: 'description', header: 'Description', type: 'textarea' },
      {
        field: 'actions',
        header: 'actions',
        type: 'actions',
        actions: [
          { label: 'test', icon: 'pi pi-check-square', severity: 'success', onClick: (row: StrategyRuleResponse) => this.goTest(row.id) },
          { label: 'edit', icon: 'pi pi-pencil', severity: 'info', onClick: (row: StrategyRuleResponse) => this.goEdit(row.id) },
          { label: 'delete', icon: 'pi pi-trash', severity: 'danger', onClick: (row: StrategyRuleResponse) => this.remove(row.id) }
        ]
      }
    ],
    pagination: true,
    rows: DEFAULT_TABLE_ROWS,
    rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
  };

  loading = false;

  constructor(
    private readonly service: StrategyRuleService,
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
    void this.router.navigate([STRATEGY_RULE_ROUTES.create]);
  }

  private goEdit(id: string): void {
    void this.router.navigate([STRATEGY_RULE_ROUTES.edit(id)]);
  }

  private goTest(id: string): void {
    void this.router.navigate([STRATEGY_RULE_ROUTES.test(id)]);
  }

  private remove(id: string): void {
    this.loading = true;
    this.loadingService.track(this.service.delete(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.success('Delete rule successfully');
        this.loadPage();
      },
      error: (error) => this.toastService.error(error?.error?.errorMessage ?? 'Delete rule failed')
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
        next: (res: BasePageResponse<StrategyRuleResponse>) => this.setPageResponse(res),
        error: () => this.toastService.error('Load rule list failed')
      });
  }
}
