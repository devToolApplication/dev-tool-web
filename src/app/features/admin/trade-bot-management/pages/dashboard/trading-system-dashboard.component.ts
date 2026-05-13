import { Component, OnInit, computed, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';
import { BacktestRunResponse, CandleGapResponse, CandleSyncRunResponse, SystemLogResponse } from '../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';

@Component({
  selector: 'app-trading-system-dashboard',
  standalone: false,
  templateUrl: './trading-system-dashboard.component.html'
})
export class TradingSystemDashboardComponent implements OnInit {
  readonly loading = signal(false);
  readonly syncRuns = signal<CandleSyncRunResponse[]>([]);
  readonly gaps = signal<CandleGapResponse[]>([]);
  readonly backtests = signal<BacktestRunResponse[]>([]);
  readonly logs = signal<SystemLogResponse[]>([]);

  readonly cards = computed(() => [
    { label: 'tradeBot.dashboard.syncRuns', value: this.syncRuns().length },
    { label: 'tradeBot.dashboard.openGaps', value: this.gaps().length },
    { label: 'tradeBot.dashboard.backtests', value: this.backtests().length },
    { label: 'tradeBot.dashboard.errorLogs', value: this.logs().filter((log) => log.level === 'ERROR').length }
  ]);

  readonly syncRunTableConfig: TableConfig = {
    title: 'tradeBot.sync.runs',
    columns: [
      { field: 'startedAt', header: 'tradeBot.field.startedAt', type: 'date', minWidth: '13rem' },
      { field: 'symbol', header: 'tradeBot.field.symbol' },
      { field: 'timeframe', header: 'tradeBot.field.timeframe' },
      { field: 'mode', header: 'tradeBot.field.mode' },
      { field: 'status', header: 'tradeBot.field.status' },
      { field: 'gapsDetected', header: 'tradeBot.field.gapsDetected', type: 'number' }
    ],
    pagination: true,
    rows: 10
  };

  readonly backtestTableConfig: TableConfig = {
    title: 'tradeBot.backtest.title',
    columns: [
      { field: 'runId', header: 'tradeBot.field.runId', minWidth: '18rem' },
      { field: 'strategyCode', header: 'tradeBot.field.strategyCode' },
      { field: 'symbol', header: 'tradeBot.field.symbol' },
      { field: 'timeframe', header: 'tradeBot.field.timeframe' },
      { field: 'status', header: 'tradeBot.field.status' },
      { field: 'startedAt', header: 'tradeBot.field.startedAt', type: 'date', minWidth: '13rem' }
    ],
    pagination: true,
    rows: 10,
    minWidth: '76rem'
  };

  constructor(
    private readonly service: TradingSystemService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadingService
      .track(
        forkJoin({
          syncRuns: this.service.getCandleSyncRuns({ limit: 20 }),
          gaps: this.service.getCandleGaps({ limit: 20 }),
          backtests: this.service.getBacktests(),
          logs: this.service.getSystemLogs({ limit: 20 })
        })
      )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.syncRuns.set(res.syncRuns);
          this.gaps.set(res.gaps);
          this.backtests.set(res.backtests.slice(0, 20));
          this.logs.set(res.logs);
        },
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.loadFailed'))
      });
  }
}
