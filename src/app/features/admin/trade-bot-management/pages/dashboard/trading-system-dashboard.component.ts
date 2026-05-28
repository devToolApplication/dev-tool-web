import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { BacktestRunResponse, CandleGapResponse, CandleSyncRunResponse, SystemLogResponse } from '../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { ActionToolbarAction } from '../../../../../shared/ui/layout/action-toolbar/action-toolbar.component';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { PaperTradeApiService } from '../../data-access/api/paper-trade-api.service';
import { PaperTradeSession } from '../../data-access/models/paper-trade.model';
import { TRADE_BOT_ROUTES } from '../../trade-bot-runtime.constants';

@Component({
  selector: 'app-trading-system-dashboard',
  standalone: false,
  templateUrl: './trading-system-dashboard.component.html'
})
export class TradingSystemDashboardComponent implements OnInit {
  readonly loading = signal(false);
  readonly syncRunError = signal<string | null>(null);
  readonly gapError = signal<string | null>(null);
  readonly backtestError = signal<string | null>(null);
  readonly logError = signal<string | null>(null);
  readonly paperError = signal<string | null>(null);
  readonly syncRuns = signal<CandleSyncRunResponse[]>([]);
  readonly gaps = signal<CandleGapResponse[]>([]);
  readonly backtests = signal<BacktestRunResponse[]>([]);
  readonly logs = signal<SystemLogResponse[]>([]);
  readonly paperSessions = signal<PaperTradeSession[]>([]);

  readonly openGaps = computed(() => this.gaps().filter((gap) => String(gap.status ?? '').toUpperCase() === 'OPEN'));
  readonly runningBacktests = computed(() => this.backtests().filter((run) => run.status === 'RUNNING'));
  readonly failedBacktests = computed(() => this.backtests().filter((run) => run.status === 'FAILED'));
  readonly failedSyncRuns = computed(() => this.syncRuns().filter((run) => String(run.status ?? '').toUpperCase() === 'FAILED'));
  readonly errorLogs = computed(() => this.logs().filter((log) => String(log.level ?? '').toUpperCase() === 'ERROR'));
  readonly activePaperSessions = computed(() => this.paperSessions().filter((session) => session.status === 'RUNNING'));
  readonly cards = computed(() => [
    { label: 'tradeBot.dashboard.marketHealth', value: this.openGaps().length ? 'tradeBot.dashboard.needsAttention' : 'tradeBot.dashboard.ok', routerLink: TRADE_BOT_ROUTES.marketData },
    { label: 'tradeBot.dashboard.openGaps', value: this.openGaps().length, routerLink: TRADE_BOT_ROUTES.marketData, queryParams: { tab: 'gaps', status: 'OPEN' } },
    { label: 'tradeBot.dashboard.runningBacktests', value: this.runningBacktests().length, routerLink: TRADE_BOT_ROUTES.backtests, queryParams: { status: 'RUNNING' } },
    { label: 'tradeBot.dashboard.activePaperSessions', value: this.activePaperSessions().length, routerLink: TRADE_BOT_ROUTES.paperTrade },
    { label: 'tradeBot.dashboard.failedSyncRuns', value: this.failedSyncRuns().length, routerLink: TRADE_BOT_ROUTES.marketData, queryParams: { tab: 'sync', status: 'FAILED' } },
    { label: 'tradeBot.dashboard.errorLogs', value: this.errorLogs().length, routerLink: TRADE_BOT_ROUTES.systemLogs, queryParams: { level: 'ERROR' } }
  ]);

  readonly quickActions = [
    {
      id: 'sync-market-data',
      label: 'tradeBot.dashboard.action.syncMarketData',
      icon: 'pi pi-database',
      variant: 'primary' as const,
      placement: 'secondary' as const
    },
    {
      id: 'new-backtest',
      label: 'tradeBot.dashboard.action.newBacktest',
      icon: 'pi pi-play',
      variant: 'primary' as const,
      placement: 'secondary' as const
    },
    {
      id: 'open-paper-trade',
      label: 'tradeBot.dashboard.action.openPaperTrade',
      icon: 'pi pi-wallet',
      placement: 'secondary' as const
    },
    {
      id: 'view-gaps',
      label: 'tradeBot.dashboard.action.viewGaps',
      icon: 'pi pi-exclamation-triangle',
      variant: 'warning' as const,
      placement: 'secondary' as const
    },
    {
      id: 'view-logs',
      label: 'tradeBot.dashboard.action.viewLogs',
      icon: 'pi pi-list-check',
      variant: 'danger' as const,
      placement: 'secondary' as const
    }
  ];

  readonly syncRunTableConfig: TableConfig = {
    title: 'tradeBot.sync.runs',
    columns: [
      { field: 'startedAt', header: 'tradeBot.field.startedAt', type: 'date', minWidth: '13rem' },
      { field: 'symbol', header: 'tradeBot.field.symbol' },
      { field: 'timeframe', header: 'tradeBot.field.timeframe' },
      { field: 'mode', header: 'tradeBot.field.mode' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'gapsDetected', header: 'tradeBot.field.gapsDetected', type: 'number' },
      { field: 'durationMs', header: 'tradeBot.field.duration', type: 'duration' }
    ],
    pagination: true,
    rows: 10
  };

  readonly backtestTableConfig: TableConfig = {
    title: 'tradeBot.backtest.title',
    columns: [
      { field: 'runId', header: 'tradeBot.field.runId', type: 'copyable', minWidth: '18rem' },
      { field: 'strategyCode', header: 'tradeBot.field.strategyCode' },
      { field: 'symbol', header: 'tradeBot.field.symbol' },
      { field: 'timeframe', header: 'tradeBot.field.timeframe' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'startedAt', header: 'tradeBot.field.startedAt', type: 'date', minWidth: '13rem' }
    ],
    pagination: true,
    rows: 10,
    minWidth: '68rem'
  };

  readonly gapTableConfig: TableConfig = {
    title: 'tradeBot.dashboard.openGaps',
    columns: [
      { field: 'createdAt', header: 'tradeBot.field.createdAt', type: 'date', minWidth: '13rem' },
      { field: 'source', header: 'tradeBot.field.source' },
      { field: 'symbol', header: 'tradeBot.field.symbol' },
      { field: 'timeframe', header: 'tradeBot.field.timeframe' },
      { field: 'missingBars', header: 'tradeBot.field.missingBars', type: 'number' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' }
    ],
    pagination: true,
    rows: 10,
    minWidth: '64rem'
  };

  readonly errorTableConfig: TableConfig = {
    title: 'tradeBot.dashboard.errorLogs',
    columns: [
      { field: 'time', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' },
      { field: 'level', header: 'tradeBot.field.level', type: 'badge' },
      { field: 'module', header: 'tradeBot.field.module' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'runId', header: 'tradeBot.field.runId', type: 'copyable', minWidth: '18rem' },
      { field: 'message', header: 'tradeBot.field.message', minWidth: '20rem' }
    ],
    pagination: true,
    rows: 10,
    minWidth: '72rem'
  };

  readonly activePaperTableConfig: TableConfig = {
    title: 'tradeBot.dashboard.activePaperSessions',
    columns: [
      { field: 'sessionId', header: 'tradeBot.field.sessionId', type: 'copyable', minWidth: '18rem' },
      { field: 'accountId', header: 'tradeBot.field.accountId', type: 'copyable', minWidth: '16rem' },
      { field: 'strategyCode', header: 'tradeBot.field.strategyCode' },
      { field: 'symbol', header: 'tradeBot.field.symbol' },
      { field: 'interval', header: 'tradeBot.field.timeframe' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'lastEvaluatedBarTime', header: 'tradeBot.paper.lastBar', type: 'date', minWidth: '13rem' },
      { field: 'lastErrorMessage', header: 'tradeBot.field.errorMessage', minWidth: '18rem' }
    ],
    pagination: true,
    rows: 10,
    minWidth: '78rem'
  };

  constructor(
    private readonly router: Router,
    private readonly service: TradingSystemService,
    private readonly paperTradeApi: PaperTradeApiService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  onQuickAction(action: ActionToolbarAction): void {
    switch (action.id) {
      case 'sync-market-data':
        void this.router.navigate([TRADE_BOT_ROUTES.marketData], { queryParams: { tab: 'sync' } });
        return;
      case 'new-backtest':
        void this.router.navigate([TRADE_BOT_ROUTES.backtests]);
        return;
      case 'open-paper-trade':
        void this.router.navigate([TRADE_BOT_ROUTES.paperTrade]);
        return;
      case 'view-gaps':
        void this.router.navigate([TRADE_BOT_ROUTES.marketData], { queryParams: { tab: 'gaps', status: 'OPEN' } });
        return;
      case 'view-logs':
        void this.router.navigate([TRADE_BOT_ROUTES.systemLogs], { queryParams: { level: 'ERROR' } });
        return;
      default:
        return;
    }
  }

  load(): void {
    const loadFailedMessage = this.i18nService.t('tradeBot.message.loadFailed');
    this.loading.set(true);
    this.syncRunError.set(null);
    this.gapError.set(null);
    this.backtestError.set(null);
    this.logError.set(null);
    this.paperError.set(null);
    this.loadingService
      .track(
        forkJoin({
          syncRuns: this.service.getCandleSyncRuns({ limit: 20 }).pipe(catchError(() => {
            this.syncRunError.set(loadFailedMessage);
            return of([] as CandleSyncRunResponse[]);
          })),
          gaps: this.service.getCandleGaps({ limit: 50 }).pipe(catchError(() => {
            this.gapError.set(loadFailedMessage);
            return of([] as CandleGapResponse[]);
          })),
          backtests: this.service.getBacktests().pipe(catchError(() => {
            this.backtestError.set(loadFailedMessage);
            return of([] as BacktestRunResponse[]);
          })),
          paperSessions: this.paperTradeApi.getSessions({ status: 'RUNNING', limit: 20 }).pipe(catchError(() => {
            this.paperError.set(loadFailedMessage);
            return of([] as PaperTradeSession[]);
          })),
          logs: this.service.getSystemLogs({ limit: 20 }).pipe(catchError(() => {
            this.logError.set(loadFailedMessage);
            return of([] as SystemLogResponse[]);
          }))
        })
      )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.syncRuns.set(res.syncRuns);
          this.gaps.set(res.gaps);
          this.backtests.set(res.backtests.slice(0, 20));
          this.paperSessions.set(res.paperSessions);
          this.logs.set(res.logs);
        },
        error: () => {
          this.syncRunError.set(loadFailedMessage);
          this.gapError.set(loadFailedMessage);
          this.backtestError.set(loadFailedMessage);
          this.logError.set(loadFailedMessage);
          this.paperError.set(loadFailedMessage);
          this.toastService.error(loadFailedMessage);
        }
      });
  }
}
