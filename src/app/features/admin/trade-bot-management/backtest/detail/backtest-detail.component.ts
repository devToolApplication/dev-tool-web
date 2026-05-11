import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import {
  BacktestCurvePointResponse,
  BacktestEventResponse,
  BacktestMetricResponse,
  BacktestRunResponse,
  BacktestTradeResponse
} from '../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';

@Component({
  selector: 'app-backtest-detail',
  standalone: false,
  templateUrl: './backtest-detail.component.html'
})
export class BacktestDetailComponent implements OnInit {
  readonly loading = signal(false);
  readonly run = signal<BacktestRunResponse | null>(null);
  readonly trades = signal<BacktestTradeResponse[]>([]);
  readonly metrics = signal<BacktestMetricResponse | null>(null);
  readonly equity = signal<BacktestCurvePointResponse[]>([]);
  readonly drawdown = signal<BacktestCurvePointResponse[]>([]);
  readonly events = signal<BacktestEventResponse[]>([]);
  readonly trace = signal<Record<string, unknown> | null>(null);

  readonly tradeTableConfig: TableConfig = {
    title: 'tradeBot.backtest.trades',
    columns: [
      { field: 'tradeId', header: 'tradeBot.field.tradeId', minWidth: '18rem' },
      { field: 'side', header: 'tradeBot.field.side' },
      { field: 'entryIndex', header: 'tradeBot.field.entryIndex', type: 'number' },
      { field: 'exitIndex', header: 'tradeBot.field.exitIndex', type: 'number' },
      { field: 'entryPrice', header: 'tradeBot.field.entryPrice', type: 'number' },
      { field: 'exitPrice', header: 'tradeBot.field.exitPrice', type: 'number' },
      { field: 'pnl', header: 'tradeBot.field.pnl', type: 'number' },
      {
        field: 'actions',
        header: 'tradeBot.field.actions',
        type: 'actions',
        minWidth: '10rem',
        actions: [{ label: 'tradeBot.action.trace', icon: 'pi pi-sitemap', severity: 'info', onClick: (row) => this.loadTrace(row.tradeId) }]
      }
    ],
    pagination: true,
    rows: 20,
    minWidth: '82rem'
  };

  readonly eventTableConfig: TableConfig = {
    title: 'tradeBot.backtest.events',
    columns: [
      { field: 'barIndex', header: 'tradeBot.field.index', type: 'number' },
      { field: 'type', header: 'tradeBot.field.type' },
      { field: 'message', header: 'tradeBot.field.message' },
      { field: 'eventTime', header: 'tradeBot.field.time', type: 'date' }
    ],
    pagination: true,
    rows: 20
  };

  private runId = '';

  constructor(
    private readonly service: TradingSystemService,
    private readonly route: ActivatedRoute,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.runId = this.route.snapshot.paramMap.get('runId') ?? '';
    this.load();
  }

  traceJson(): string {
    return JSON.stringify(this.trace(), null, 2);
  }

  metricsJson(): string {
    return JSON.stringify(this.metrics()?.metrics ?? {}, null, 2);
  }

  curveJson(): string {
    return JSON.stringify({ equity: this.equity(), drawdown: this.drawdown() }, null, 2);
  }

  private load(): void {
    this.loading.set(true);
    this.loadingService
      .track(
        forkJoin({
          run: this.service.getBacktest(this.runId),
          trades: this.service.getBacktestTrades(this.runId),
          metrics: this.service.getBacktestMetrics(this.runId),
          equity: this.service.getBacktestEquityCurve(this.runId),
          drawdown: this.service.getBacktestDrawdownCurve(this.runId),
          events: this.service.getBacktestEvents(this.runId)
        })
      )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.run.set(res.run);
          this.trades.set(res.trades);
          this.metrics.set(res.metrics);
          this.equity.set(res.equity);
          this.drawdown.set(res.drawdown);
          this.events.set(res.events);
        },
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.loadFailed'))
      });
  }

  private loadTrace(tradeId: string): void {
    this.loading.set(true);
    this.loadingService
      .track(this.service.getBacktestTrace(this.runId, tradeId))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (trace) => this.trace.set(trace.trace),
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.traceMissing'))
      });
  }
}
