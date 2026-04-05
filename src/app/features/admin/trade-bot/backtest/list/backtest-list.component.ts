import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DEFAULT_TABLE_ROWS, DEFAULT_TABLE_ROWS_PER_PAGE } from '../../../../../core/constants/system.constants';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
import { BacktestJobResponse } from '../../../../../core/models/trade-bot/backtest.model';
import { BacktestService } from '../../../../../core/services/trade-bot-service/backtest.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { BasePagedList } from '../../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { TRADE_BOT_BACKTEST_ROUTES } from '../../trade-bot-admin.constants';
import { STRATEGY_MANAGEMENT_ROUTES } from '../../strategies/strategy-management.constants';
import { TradeBotTextKey } from '../../strategies/shared/strategy-ui.enums';

@Component({
  selector: 'app-backtest-list',
  standalone: false,
  templateUrl: './backtest-list.component.html'
})
export class BacktestListComponent extends BasePagedList<BacktestJobResponse> implements OnInit {
  readonly tableConfig: TableConfig = {
    title: TradeBotTextKey.BacktestReplayTitle,
    toolbar: { new: { visible: true, label: TradeBotTextKey.RunBacktest, icon: 'pi pi-play', severity: 'success' } },
    filters: [
      { field: 'exchangeCode', label: 'Exchange', placeholder: 'Filter exchange' },
      { field: 'symbolCode', label: 'Symbol', placeholder: 'Filter symbol' },
      { field: 'strategyServiceName', label: 'Strategy', placeholder: 'Filter strategy' },
      { field: 'status', label: 'Status', placeholder: 'RUNNING / COMPLETED' }
    ],
    filterOptions: { primaryField: 'symbolCode' },
    columns: [
      { field: 'exchangeCode', header: 'Exchange', sortable: true },
      { field: 'symbolCode', header: 'Symbol', sortable: true },
      { field: 'strategyServiceName', header: 'Strategy', sortable: true },
      { field: 'status', header: 'Status', sortable: true },
      { field: 'totalTrades', header: 'Trades', sortable: true },
      { field: 'pnl', header: 'PnL', sortable: true, type: 'number' },
      { field: 'finalEquity', header: 'Final Equity', sortable: true, type: 'number' },
      {
        field: 'actions',
        header: 'Actions',
        type: 'actions',
        actions: [{ label: 'Detail', icon: 'pi pi-eye', severity: 'info', onClick: (row: BacktestJobResponse) => this.goDetail(row.id) }]
      }
    ],
    pagination: true,
    rows: DEFAULT_TABLE_ROWS,
    rowsPerPageOptions: [...DEFAULT_TABLE_ROWS_PER_PAGE]
  };

  loading = false;

  constructor(
    private readonly service: BacktestService,
    private readonly i18nService: I18nService,
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
    void this.router.navigate([TRADE_BOT_BACKTEST_ROUTES.run]);
  }

  private goDetail(id: string): void {
    const job = this.rows.find((item) => item.id === id);
    if (job?.bindingId) {
      void this.router.navigate([STRATEGY_MANAGEMENT_ROUTES.backtest(job.bindingId)], { queryParams: { jobId: job.id } });
      return;
    }
    void this.router.navigate([`${TRADE_BOT_BACKTEST_ROUTES.list}/${id}`]);
  }

  protected loadPage(): void {
    this.loading = true;
    this.loadingService
      .track(this.service.getPage(this.page, this.pageSize, ['startedAt,desc'], this.filters))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: BasePageResponse<BacktestJobResponse>) => this.setPageResponse(res),
        error: () => this.toastService.error(this.i18nService.t(TradeBotTextKey.LoadReplayFailed))
      });
  }
}
