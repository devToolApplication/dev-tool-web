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
    title: 'tradeBot.replay.orders.title',
    filters: [
      { field: 'orderSide', label: 'tradeBot.replay.field.side', placeholder: 'BUY / SELL' },
      { field: 'result', label: 'tradeBot.replay.field.result', placeholder: 'WIN / LOSS' }
    ],
    filterOptions: { primaryField: 'result' },
    columns: [
      { field: 'nyTradeDate', header: 'tradeBot.replay.field.tradeDate', sortable: true },
      { field: 'orderSide', header: 'tradeBot.replay.field.side', sortable: true },
      { field: 'entryPrice', header: 'tradeBot.replay.field.entryPrice', sortable: true, type: 'number', format: '1.2-6', suffix: 'USD', minWidth: '10rem' },
      { field: 'stopLoss', header: 'SL', sortable: true, type: 'number', format: '1.2-6', suffix: 'USD', minWidth: '10rem' },
      { field: 'takeProfit', header: 'TP', sortable: true, type: 'number', format: '1.2-6', suffix: 'USD', minWidth: '10rem' },
      { field: 'exitPrice', header: 'tradeBot.replay.field.exitPrice', sortable: true, type: 'number', format: '1.2-6', suffix: 'USD', minWidth: '10rem' },
      { field: 'grossPnl', header: 'tradeBot.replay.field.grossPnl', sortable: true, type: 'number', format: '1.2-6', suffix: 'USD', minWidth: '10rem' },
      { field: 'feePaid', header: 'tradeBot.replay.field.feePaid', sortable: true, type: 'number', format: '1.2-6', suffix: 'USD', minWidth: '10rem' },
      { field: 'slippagePaid', header: 'tradeBot.replay.field.slippagePaid', sortable: true, type: 'number', format: '1.2-6', suffix: 'USD', minWidth: '10rem' },
      { field: 'netPnl', header: 'tradeBot.replay.field.netPnl', sortable: true, type: 'number', format: '1.2-6', suffix: 'USD', minWidth: '10rem' },
      { field: 'result', header: 'tradeBot.replay.field.result', sortable: true },
      { field: 'exitReason', header: 'tradeBot.replay.field.exitReason', sortable: true }
    ],
    pagination: true,
    scrollHeight: '32rem',
    minWidth: '110rem',
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
          this.toastService.error('tradeBot.backtest.detail.toast.loadFailed');
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
        error: () => this.toastService.error('tradeBot.backtest.detail.toast.loadOrdersFailed')
      });
  }
}
