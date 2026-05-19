import { Component, DestroyRef, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { TaskProgressState } from '../../../../../../core/models/realtime/realtime.model';
import { BacktestRunDto, BacktestRunResponse, CandleMarketOptionResponse } from '../../../../../../core/models/trade-bot/trading-system.model';
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
  formContext: FormContext = { user: null, mode: 'create', extra: { strategyOptions: [], getBacktestMarketOptions: () => [] } };
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly progress = signal<TaskProgressState | null>(null);
  readonly runs = signal<BacktestRunResponse[]>([]);
  formInitialValue: BacktestRunDto = {
    strategyCode: '',
    symbol: 'BTCUSDT',
    timeframe: '5M',
    source: 'BINANCE_USDM',
    marketType: 'USD_M_FUTURES',
    feedCode: 'BINANCE_USDM_BTCUSDT_5M',
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
    stateKey: 'trade-bot.backtests',
    emptyTitle: 'shared.table.emptyTitle',
    emptyDescription: 'shared.table.emptyDescription',
    errorTitle: 'tradeBot.message.loadFailed',
    toolbar: {
      columnVisibility: { visible: true },
      density: { visible: true }
    },
    columns: [
      { field: 'runId', header: 'tradeBot.field.runId', type: 'copyable', minWidth: '18rem' },
      { field: 'strategyCode', header: 'tradeBot.field.strategyCode' },
      { field: 'symbol', header: 'tradeBot.field.symbol' },
      { field: 'timeframe', header: 'tradeBot.field.timeframe' },
      { field: 'source', header: 'tradeBot.field.source' },
      { field: 'feedCode', header: 'tradeBot.field.feedCode', minWidth: '14rem' },
      {
        field: 'status',
        header: 'tradeBot.field.status',
        type: 'badge',
        badgeMap: { RUNNING: 'info', COMPLETED: 'success', FAILED: 'danger', CANCELED: 'warning' }
      },
      { field: 'currentBalance', header: 'tradeBot.field.currentBalance', type: 'number', suffix: ' USDT' },
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
    this.loadStrategyOptions();
    this.loadMarketOptions();
    this.loadRuns();
  }

  runBacktest(model: BacktestRunDto): void {
    const payload = toBacktestPayload(model);
    this.loading.set(true);
    this.loadingService
      .track(this.service.startBacktest(payload))
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

  loadRuns(): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadingService
      .track(this.service.getBacktests())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (runs) => {
          this.runs.set(runs);
          this.error.set(null);
        },
        error: () => {
          const message = this.i18nService.t('tradeBot.message.loadFailed');
          this.error.set(message);
          this.toastService.error(message);
        }
      });
  }

  private loadStrategyOptions(): void {
    this.service
      .getStrategyConfigs({ status: 'ACTIVE' })
      .pipe(catchError(() => of([])))
      .subscribe((strategies) => {
        this.formContext = {
          ...this.formContext,
          extra: {
            ...(this.formContext.extra ?? {}),
            strategyOptions: strategies.map((strategy) => ({
              label: `${strategy.code} - ${strategy.strategyVersion}`,
              value: strategy.code
            }))
          }
        };
      });
  }

  private loadMarketOptions(): void {
    this.service
      .getCandleMarketOptions(300)
      .pipe(catchError(() => of(fallbackMarketOptions())))
      .subscribe((options) => {
        const marketOptions = options.length ? options : fallbackMarketOptions();
        this.applyDefaultMarketOption(marketOptions);
        this.formContext = {
          ...this.formContext,
          extra: {
            ...(this.formContext.extra ?? {}),
            marketOptions,
            getBacktestMarketOptions: (field: BacktestMarketField, model: Partial<BacktestRunDto>) =>
              backtestMarketSelectOptions(marketOptions, field, model)
          }
        };
      });
  }

  private applyDefaultMarketOption(options: CandleMarketOptionResponse[]): void {
    if (options.some((option) => isSameMarketOption(option, this.formInitialValue))) {
      return;
    }
    const first = options[0];
    if (!first) {
      return;
    }
    this.formInitialValue = {
      ...this.formInitialValue,
      symbol: first.symbol,
      timeframe: first.timeframe,
      source: first.source,
      marketType: first.marketType ?? '',
      feedCode: first.feedCode ?? ''
    };
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

function toBacktestPayload(model: BacktestRunDto): BacktestRunDto {
  return {
    ...model,
    fromTime: toIsoString(model.fromTime),
    toTime: toIsoString(model.toTime)
  };
}

function toIsoString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value ?? '');
}

type BacktestMarketField = 'symbol' | 'timeframe' | 'source' | 'marketType' | 'feedCode';

function backtestMarketSelectOptions(
  options: CandleMarketOptionResponse[],
  field: BacktestMarketField,
  model: Partial<BacktestRunDto>
): Array<{ label: string; value: string }> {
  const filtered = options.filter((option) => matchesModel(option, field, model));
  return uniqueValues(filtered.map((option) => option[field]).filter((value): value is string => !!value))
    .map((value) => ({ label: value, value }));
}

function matchesModel(option: CandleMarketOptionResponse, field: BacktestMarketField, model: Partial<BacktestRunDto>): boolean {
  const dependenciesByField: Record<BacktestMarketField, BacktestMarketField[]> = {
    symbol: [],
    timeframe: ['symbol'],
    source: ['symbol', 'timeframe'],
    marketType: ['symbol', 'timeframe', 'source'],
    feedCode: ['symbol', 'timeframe', 'source', 'marketType']
  };
  return dependenciesByField[field].every((dependency) => {
    const modelValue = model[dependency];
    return !modelValue || option[dependency] === modelValue;
  });
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values));
}

function isSameMarketOption(option: CandleMarketOptionResponse, model: BacktestRunDto): boolean {
  return option.symbol === model.symbol
    && option.timeframe === model.timeframe
    && option.source === model.source
    && (option.marketType ?? '') === (model.marketType ?? '')
    && (option.feedCode ?? '') === (model.feedCode ?? '');
}

function fallbackMarketOptions(): CandleMarketOptionResponse[] {
  return [
    {
      symbol: 'BTCUSDT',
      timeframe: '5M',
      source: 'BINANCE_USDM',
      marketType: 'USD_M_FUTURES',
      feedCode: 'BINANCE_USDM_BTCUSDT_5M',
      count: 0
    },
    {
      symbol: 'XAUUSD',
      timeframe: '1H',
      source: 'YAHOO_CHART',
      marketType: 'CFD',
      feedCode: 'YAHOO_CHART_XAUUSD_1H',
      count: 0
    }
  ];
}
