import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { BacktestRunDto, BacktestRunResponse } from '../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { BACKTEST_RUN_FORM, TRADE_BOT_ROUTES } from '../../trade-bot-runtime.constants';

@Component({
  selector: 'app-backtest-list',
  standalone: false,
  templateUrl: './backtest-list.component.html'
})
export class BacktestListComponent implements OnInit {
  readonly formConfig = BACKTEST_RUN_FORM;
  readonly formContext: FormContext = { user: null, mode: 'create' };
  readonly loading = signal(false);
  readonly runs = signal<BacktestRunResponse[]>([]);
  readonly formInitialValue: BacktestRunDto = {
    strategyCode: '',
    symbol: 'XAUUSD',
    timeframe: 'M15',
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
    private readonly router: Router,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.loadRuns();
  }

  runBacktest(model: BacktestRunDto): void {
    this.loading.set(true);
    this.loadingService
      .track(this.service.runBacktest(model))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (run) => {
          this.toastService.info(this.i18nService.t('tradeBot.message.backtestCompleted'));
          this.loadRuns();
          this.openDetail(run.runId ?? run.id);
        },
        error: () => this.toastService.error(this.i18nService.t('tradeBot.message.backtestFailed'))
      });
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
}
