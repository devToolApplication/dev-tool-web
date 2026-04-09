import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';
import { BasePageResponse } from '../../../../../core/models/base-response.model';
import { BacktestJobResponse, BacktestMetricResponse, BacktestOrderResponse } from '../../../../../core/models/trade-bot/backtest.model';
import { BacktestService } from '../../../../../core/services/trade-bot-service/backtest.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { TRADE_BOT_BACKTEST_ROUTES } from '../../trade-bot-admin.constants';

@Component({
  selector: 'app-backtest-detail',
  standalone: false,
  templateUrl: './backtest-detail.component.html',
  styleUrl: './backtest-detail.component.css'
})
export class BacktestDetailComponent implements OnInit {
  readonly orderTableConfig: TableConfig = {
    title: 'Backtest Orders',
    filters: [
      { field: 'orderSide', label: 'Order Side', placeholder: 'BUY / SELL' },
      { field: 'result', label: 'Result', placeholder: 'WIN / LOSS' }
    ],
    filterOptions: { primaryField: 'result' },
    columns: [
      { field: 'nyTradeDate', header: 'Trade Date', sortable: true },
      { field: 'orderSide', header: 'Side', sortable: true },
      { field: 'entryPrice', header: 'Entry', sortable: true, type: 'number' },
      { field: 'stopLoss', header: 'SL', sortable: true, type: 'number' },
      { field: 'takeProfit', header: 'TP', sortable: true, type: 'number' },
      { field: 'exitPrice', header: 'Exit', sortable: true, type: 'number' },
      { field: 'netPnl', header: 'Net PnL', sortable: true, type: 'number' },
      { field: 'result', header: 'Result', sortable: true },
      { field: 'exitReason', header: 'Exit Reason', sortable: true }
    ],
    pagination: true,
    scrollHeight: '32rem',
    rows: 20,
    rowsPerPageOptions: [10, 20, 50, 100]
  };

  job: BacktestJobResponse | null = null;
  metric: BacktestMetricResponse | null = null;
  orders: BacktestOrderResponse[] = [];
  loading = false;
  orderFilters: Record<string, unknown> = {};

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly backtestService: BacktestService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    const jobId = this.route.snapshot.paramMap.get('id');
    if (!jobId) {
      void this.router.navigate([TRADE_BOT_BACKTEST_ROUTES.list]);
      return;
    }
    this.loadDetail(jobId);
  }

  onBack(): void {
    void this.router.navigate([TRADE_BOT_BACKTEST_ROUTES.list]);
  }

  onSearchOrders(filters: Record<string, unknown>): void {
    this.orderFilters = filters;
    if (this.job) {
      this.loadOrders(this.job.id);
    }
  }

  onResetOrders(): void {
    this.orderFilters = {};
    if (this.job) {
      this.loadOrders(this.job.id);
    }
  }

  private loadDetail(jobId: string): void {
    this.loading = true;
    this.loadingService
      .track(
        forkJoin({
          job: this.backtestService.getById(jobId),
          metric: this.backtestService.getMetrics(jobId),
          orders: this.backtestService.getOrders(jobId, 0, 500, ['entryTime,desc'], this.orderFilters)
        })
      )
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ job, metric, orders }) => {
          this.job = job;
          this.metric = metric;
          this.orders = orders.data ?? [];
        },
        error: () => {
          this.toastService.error('Load backtest detail failed');
          void this.router.navigate([TRADE_BOT_BACKTEST_ROUTES.list]);
        }
      });
  }

  private loadOrders(jobId: string): void {
    this.loading = true;
    this.loadingService
      .track(this.backtestService.getOrders(jobId, 0, 500, ['entryTime,desc'], this.orderFilters))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (orders: BasePageResponse<BacktestOrderResponse>) => (this.orders = orders.data ?? []),
        error: () => this.toastService.error('Load orders failed')
      });
  }
}
