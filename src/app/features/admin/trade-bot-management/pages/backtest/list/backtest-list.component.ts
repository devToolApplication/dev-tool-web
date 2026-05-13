import { Component, DestroyRef, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TaskProgressState } from '../../../../../../core/models/realtime/realtime.model';
import { BacktestRunDto, BacktestRunResponse } from '../../../../../../core/models/trade-bot/trading-system.model';
import { RealtimeTaskStateService } from '../../../../../../core/services/realtime/realtime-task-state.service';
import { RealtimeWebSocketService } from '../../../../../../core/services/realtime/realtime-websocket.service';
import { TaskProgressStoreService } from '../../../../../../core/services/realtime/task-progress-store.service';
import { TradingSystemService } from '../../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { FormContext } from '../../../../../../shared/ui/form-input/models/form-config.model';
import { TableConfig } from '../../../../../../shared/ui/table/models/table-config.model';
import { BACKTEST_RUN_FORM, TRADE_BOT_ROUTES } from '../../../trade-bot-runtime.constants';

@Component({
  selector: 'app-backtest-list',
  standalone: false,
  templateUrl: './backtest-list.component.html'
})
export class BacktestListComponent implements OnInit {
  readonly formConfig = BACKTEST_RUN_FORM;
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly loading = signal(false);
  readonly progress = signal<TaskProgressState | null>(null);
  readonly runs = signal<BacktestRunResponse[]>([]);
  readonly formInitialValue: BacktestRunDto = {
    strategyCode: '',
    symbol: 'XAUUSD',
    timeframe: 'M15',
    source: 'INTERNAL',
    marketType: '',
    feedCode: '',
    fromTime: '',
    toTime: '',
    initialBalance: 10000,
    riskPerTradePct: 1,
    feeRate: 0,
    slippageRate: 0,
    sameBarExitPolicy: 'SL_FIRST',
    auditLevel: 'SUMMARY',
    saveFailedEntrySummary: false
  };

  readonly tableConfig: TableConfig = {
    title: 'tradeBot.backtest.title',
    columns: [
      { field: 'runId', header: 'tradeBot.field.runId', minWidth: '18rem' },
      { field: 'strategyCode', header: 'tradeBot.field.strategyCode' },
      { field: 'symbol', header: 'tradeBot.field.symbol' },
      { field: 'timeframe', header: 'tradeBot.field.timeframe' },
      { field: 'source', header: 'tradeBot.field.source' },
      { field: 'feedCode', header: 'tradeBot.field.feedCode', minWidth: '14rem' },
      { field: 'status', header: 'tradeBot.field.status' },
      { field: 'currentBalance', header: 'tradeBot.field.currentBalance', type: 'number' },
      { field: 'startedAt', header: 'tradeBot.field.startedAt', type: 'date', minWidth: '13rem' },
      {
        field: 'actions',
        header: 'tradeBot.field.actions',
        type: 'actions',
        minWidth: '10rem',
        frozen: true,
        alignFrozen: 'right',
        actions: [{ label: 'tradeBot.action.detail', icon: 'pi pi-eye', severity: 'info', onClick: (row) => this.openDetail(row.runId) }]
      }
    ],
    pagination: true,
    rows: 20,
    minWidth: '86rem'
  };

  constructor(
    private readonly service: TradingSystemService,
    private readonly realtimeWebSocketService: RealtimeWebSocketService,
    private readonly progressStore: TaskProgressStoreService,
    private readonly taskStateService: RealtimeTaskStateService,
    private readonly router: Router,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService,
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.loadRuns();
  }

  runBacktest(model: BacktestRunDto): void {
    this.loading.set(true);
    this.loadingService
      .track(this.service.startBacktest(model))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.toastService.info(this.i18nService.t('tradeBot.message.backtestStarted'));
          this.watchProgress(response.runId);
          this.loadRuns();
        },
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.backtestFailed'))
      });
  }

  cancelBacktest(): void {
    const state = this.progress();
    if (state) {
      this.realtimeWebSocketService.cancelTask(state.taskType, state.taskId);
    }
  }

  private loadRuns(): void {
    this.loading.set(true);
    this.loadingService
      .track(this.service.getBacktests())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (runs) => this.runs.set(runs),
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.loadFailed'))
      });
  }

  private openDetail(runId: string): void {
    void this.router.navigate([`${TRADE_BOT_ROUTES.backtests}/${runId}`]);
  }

  private watchProgress(runId: string): void {
    this.realtimeWebSocketService
      .subscribeProgress('BACKTEST', runId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.progressStore.update(event);
        if (event.status === 'COMPLETED') {
          this.loadRuns();
          this.openDetail(runId);
        }
      });
    this.progressStore
      .getState$('BACKTEST', runId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => this.progress.set(state));
    this.taskStateService.getLatestState('BACKTEST', runId).subscribe((state) => {
      if (state) {
        this.progressStore.patch(state);
      }
    });
  }
}
