import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SystemLogResponse } from '../../../../../core/models/trade-bot/trading-system.model';
import { TradingSystemService } from '../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { mergeTextOptions, toUniqueTextOptions } from '../../trade-bot-form-utils';
import { SYMBOL_OPTIONS, TIMEFRAME_OPTIONS, TRADE_BOT_ROUTES } from '../../trade-bot-runtime.constants';

@Component({
  selector: 'app-system-logs',
  standalone: false,
  templateUrl: './system-logs.component.html'
})
export class SystemLogsComponent implements OnInit {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly logs = signal<SystemLogResponse[]>([]);
  readonly selectedLog = signal<SystemLogResponse | null>(null);
  readonly filterModel = signal<Record<string, unknown>>({ module: '', level: '', status: '', runId: '', traceId: '', symbol: '', timeframe: '', fromTime: '', toTime: '', limit: 100 });
  readonly summaryCards = computed(() => {
    const logs = this.logs();
    const errorLogs = logs.filter((log) => String(log.level ?? '').toUpperCase() === 'ERROR');
    const warnLogs = logs.filter((log) => String(log.level ?? '').toUpperCase() === 'WARN' || String(log.level ?? '').toUpperCase() === 'WARNING');
    return [
      { label: 'tradeBot.logs.errorCount', value: errorLogs.length },
      { label: 'tradeBot.logs.warnCount', value: warnLogs.length },
      { label: 'tradeBot.logs.lastErrorTime', value: errorLogs[0]?.time ?? null },
      { label: 'tradeBot.logs.mostFailingModule', value: this.mostFailingModule(errorLogs) }
    ];
  });
  formContext: FormContext = {
    user: null,
    mode: 'create',
    extra: {
      moduleOptions: [],
      runIdOptions: [],
      traceIdOptions: [],
      symbolOptions: SYMBOL_OPTIONS,
      timeframeOptions: TIMEFRAME_OPTIONS
    }
  };
  readonly filterForm: FormConfig = {
    fields: [
      { name: 'module', type: 'auto-complete', label: 'tradeBot.field.module', optionsExpression: 'context.extra?.moduleOptions ?? []', width: '1/4' },
      { name: 'level', type: 'select', label: 'tradeBot.field.level', width: '1/4', showClear: true, options: [
        { label: 'ERROR', value: 'ERROR' },
        { label: 'WARN', value: 'WARN' },
        { label: 'INFO', value: 'INFO' },
        { label: 'DEBUG', value: 'DEBUG' }
      ] },
      { name: 'status', type: 'select', label: 'tradeBot.field.status', width: '1/4', showClear: true, options: [
        { label: 'FAILED', value: 'FAILED' },
        { label: 'COMPLETED', value: 'COMPLETED' },
        { label: 'RUNNING', value: 'RUNNING' }
      ] },
      { name: 'runId', type: 'auto-complete', label: 'tradeBot.field.runId', optionsExpression: 'context.extra?.runIdOptions ?? []', width: '1/4' },
      { name: 'traceId', type: 'auto-complete', label: 'tradeBot.field.traceId', optionsExpression: 'context.extra?.traceIdOptions ?? []', width: '1/4' },
      { name: 'symbol', type: 'auto-complete', label: 'tradeBot.field.symbol', optionsExpression: 'context.extra?.symbolOptions ?? []', width: '1/4' },
      { name: 'timeframe', type: 'auto-complete', label: 'tradeBot.field.timeframe', optionsExpression: 'context.extra?.timeframeOptions ?? []', width: '1/4' },
      { name: 'fromTime', type: 'date', label: 'tradeBot.field.fromTime', width: '1/4' },
      { name: 'toTime', type: 'date', label: 'tradeBot.field.toTime', width: '1/4' },
      { name: 'limit', type: 'number', label: 'tradeBot.field.limit', suffix: 'logs', width: '1/4' }
    ]
  };
  readonly tableConfig: TableConfig = {
    title: 'tradeBot.logs.title',
    columns: [
      { field: 'time', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' },
      { field: 'module', header: 'tradeBot.field.module' },
      { field: 'level', header: 'tradeBot.field.level', type: 'badge' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      { field: 'runId', header: 'tradeBot.field.runId', type: 'copyable', minWidth: '18rem' },
      { field: 'traceId', header: 'tradeBot.field.traceId', type: 'copyable', minWidth: '18rem' },
      { field: 'message', header: 'tradeBot.field.message', minWidth: '18rem' },
      { field: 'symbol', header: 'tradeBot.field.symbol' },
      { field: 'timeframe', header: 'tradeBot.field.timeframe' },
      {
        field: 'actions',
        header: 'tradeBot.field.actions',
        type: 'actions',
        minWidth: '10rem',
        actions: [
          { label: 'tradeBot.action.detail', icon: 'pi pi-eye', severity: 'info', showLabel: false, onClick: (row) => this.selectedLog.set(row) },
          { label: 'tradeBot.logs.openRelated', icon: 'pi pi-arrow-up-right', severity: 'secondary', showLabel: false, onClick: (row) => this.openRelated(row) }
        ]
      }
    ],
    pagination: true,
    rows: 25,
    scrollable: true,
    minWidth: '110rem'
  };

  constructor(
    private readonly service: TradingSystemService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap;
    this.filterModel.set({
      ...this.filterModel(),
      module: query.get('module') ?? '',
      level: query.get('level') ?? '',
      status: query.get('status') ?? '',
      runId: query.get('runId') ?? '',
      traceId: query.get('traceId') ?? '',
      symbol: query.get('symbol') ?? '',
      timeframe: query.get('timeframe') ?? ''
    });
    this.load(this.filterModel());
  }

  load(model: Record<string, unknown>): void {
    const filters = normalizeFilterModel(model);
    this.filterModel.set(model);
    this.loading.set(true);
    this.error.set(null);
    this.loadingService
      .track(this.service.getSystemLogs(filters))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (logs) => {
          this.logs.set(logs);
          this.updateFilterOptions(logs);
          this.error.set(null);
        },
        error: () => {
          const message = this.i18nService.t('tradeBot.message.loadFailed');
          this.error.set(message);
          this.toastService.error(message);
        }
      });
  }

  retryLoad(): void {
    this.load(this.filterModel());
  }

  closeDrawer(): void {
    this.selectedLog.set(null);
  }

  handleLogDrawerOpenChange(open: boolean): void {
    if (!open) {
      this.closeDrawer();
    }
  }

  logJson(): SystemLogResponse | null {
    return this.selectedLog();
  }

  private openRelated(log: SystemLogResponse): void {
    const module = String(log.module ?? '').toUpperCase();
    if (module.includes('BACKTEST')) {
      void this.router.navigate(log.runId ? [`${TRADE_BOT_ROUTES.backtests}/${log.runId}`] : [TRADE_BOT_ROUTES.backtests]);
      return;
    }
    if (module.includes('PAPER')) {
      void this.router.navigate([TRADE_BOT_ROUTES.paperTrade]);
      return;
    }
    if (module.includes('CANDLE') || module.includes('MARKET') || module.includes('SYNC')) {
      void this.router.navigate([TRADE_BOT_ROUTES.marketData], { queryParams: { tab: 'sync', runId: log.runId } });
    }
  }

  private mostFailingModule(logs: SystemLogResponse[]): string | null {
    const counts = new Map<string, number>();
    logs.forEach((log) => {
      const module = String(log.module ?? '').trim();
      if (module) {
        counts.set(module, (counts.get(module) ?? 0) + 1);
      }
    });
    return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
  }

  private updateFilterOptions(logs: SystemLogResponse[]): void {
    this.formContext = {
      ...this.formContext,
      extra: {
        ...this.formContext.extra,
        moduleOptions: toUniqueTextOptions(logs, (log) => log.module),
        runIdOptions: toUniqueTextOptions(logs, (log) => log.runId),
        traceIdOptions: toUniqueTextOptions(logs, (log) => log.traceId),
        symbolOptions: mergeTextOptions(SYMBOL_OPTIONS, toUniqueTextOptions(logs, (log) => log.symbol)),
        timeframeOptions: mergeTextOptions(TIMEFRAME_OPTIONS, toUniqueTextOptions(logs, (log) => log.timeframe))
      }
    };
  }
}

function normalizeFilterModel(model: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(model).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value])
  );
}
