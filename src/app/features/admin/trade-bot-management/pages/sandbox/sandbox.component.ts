import { Component, computed, signal } from '@angular/core';
import { catchError, finalize, of } from 'rxjs';
import {
  EvaluateBarRequest,
  EvaluateBarResponse,
  FastBacktestRequest,
  FastBacktestResponse
} from '../../../../../core/models/trade-bot/trading-system.model';
import { SandboxService } from '../../../../../core/services/trade-bot-service/sandbox.service';
import { TradingSystemService } from '../../../../../core/services/trade-bot-service/trading-system.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { AppTabItem } from '../../../../../shared/component/tabs/tabs.component';
import { FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { TableConfig } from '../../../../../shared/ui/table/models/table-config.model';
import { EVALUATE_BAR_FORM, SANDBOX_FORM } from '../../trade-bot-runtime.constants';
import { parseJson } from '../../trade-bot-form-utils';

type SandboxHistoryType = 'FAST_BACKTEST' | 'EVALUATE_BAR';

interface SandboxHistoryRow extends Record<string, unknown> {
  id: string;
  type: SandboxHistoryType;
  strategyCode: string;
  symbol: string;
  timeframe: string;
  executedAt: string;
  status: 'SUCCESS';
  request: Record<string, unknown>;
  response: Record<string, unknown>;
}

@Component({
  selector: 'app-trade-bot-sandbox',
  standalone: false,
  templateUrl: './sandbox.component.html'
})
export class SandboxComponent {
  readonly sandboxForm = SANDBOX_FORM;
  readonly evaluateBarForm = EVALUATE_BAR_FORM;
  formContext: FormContext = { user: null, mode: 'create', extra: { strategyOptions: [] } };
  readonly loading = signal(false);
  readonly evaluateLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly fastBacktest = signal<FastBacktestResponse | null>(null);
  readonly evaluateBar = signal<EvaluateBarResponse | null>(null);
  readonly activeTab = signal('fastBacktest');
  readonly history = signal<SandboxHistoryRow[]>([]);
  readonly selectedRaw = signal<SandboxHistoryRow | null>(null);
  readonly rawDialogVisible = signal(false);
  readonly tabs: AppTabItem[] = [
    { label: 'tradeBot.sandbox.fastBacktest', value: 'fastBacktest' },
    { label: 'tradeBot.sandbox.evaluateBar', value: 'evaluateBar' },
    { label: 'tradeBot.sandbox.history', value: 'history' },
    { label: 'tradeBot.common.advancedRawJson', value: 'raw' }
  ];
  readonly fastBacktestSummary = computed(() => {
    const response = this.fastBacktest();
    const result = response?.result ?? {};
    return [
      { label: 'tradeBot.field.requestId', value: response?.requestId ?? '-' },
      { label: 'tradeBot.field.candleRangeHash', value: response?.candleRangeHash ?? '-' },
      { label: 'tradeBot.field.totalTrades', value: metricValue(result, ['totalTrades', 'trades', 'tradeCount']) },
      { label: 'tradeBot.field.pnl', value: metricValue(result, ['pnl', 'netPnl', 'totalPnl']), suffix: ' USDT' },
      { label: 'tradeBot.field.returnPct', value: metricValue(result, ['returnPct', 'roiPct', 'returnPercentage']), suffix: '%' },
      { label: 'tradeBot.field.maxDrawdown', value: metricValue(result, ['maxDrawdown', 'maxDrawdownPct']), suffix: '%' }
    ];
  });
  readonly evaluateSummary = computed(() => {
    const response = this.evaluateBar();
    return [
      { label: 'tradeBot.field.candleRangeHash', value: response?.candleRangeHash ?? '-' },
      { label: 'tradeBot.field.index', value: response?.index ?? '-' },
      { label: 'tradeBot.sandbox.finalSignal', value: summarizeRecord(response?.finalSignal ?? response?.signal) },
      { label: 'tradeBot.sandbox.indicators', value: Object.keys(response?.indicatorValues ?? {}).length }
    ];
  });
  readonly rawJson = computed(() => this.selectedRaw() ?? { fastBacktest: this.fastBacktest(), evaluateBar: this.evaluateBar() });

  readonly historyTableConfig: TableConfig = {
    title: 'tradeBot.sandbox.history',
    columns: [
      { field: 'executedAt', header: 'tradeBot.field.time', type: 'date', minWidth: '13rem' },
      { field: 'type', header: 'tradeBot.field.type', type: 'badge', minWidth: '10rem' },
      { field: 'strategyCode', header: 'tradeBot.field.strategyCode', minWidth: '14rem' },
      { field: 'symbol', header: 'tradeBot.field.symbol' },
      { field: 'timeframe', header: 'tradeBot.field.timeframe' },
      { field: 'status', header: 'tradeBot.field.status', type: 'badge' },
      {
        field: 'actions',
        header: 'tradeBot.field.actions',
        type: 'actions',
        actions: [{ label: 'tradeBot.action.viewJson', icon: 'pi pi-code', severity: 'secondary', showLabel: false, onClick: (row) => this.openRaw(row) }]
      }
    ],
    pagination: true,
    rows: 10,
    scrollable: true,
    minWidth: '80rem'
  };

  readonly sandboxInitialValue = {
    strategyCode: '',
    symbol: 'XAUUSD',
    timeframe: 'M15',
    source: 'INTERNAL',
    marketType: '',
    feedCode: '',
    fromTime: '',
    toTime: '',
    startIndex: null,
    endIndex: null,
    warmupBars: 0,
    initialCapital: 10000,
    riskPerTradePct: 1,
    feeRate: 0,
    slippageRate: 0,
    paramsText: '{}'
  };

  readonly evaluateInitialValue = {
    strategyCode: '',
    symbol: 'XAUUSD',
    timeframe: 'M15',
    source: 'INTERNAL',
    marketType: '',
    feedCode: '',
    fromTime: '',
    toTime: '',
    index: 0,
    paramsText: '{}'
  };

  constructor(
    private readonly service: SandboxService,
    private readonly tradingSystemService: TradingSystemService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly i18nService: I18nService
  ) {
    this.loadStrategyOptions();
  }

  runFastBacktest(model: Record<string, unknown>): void {
    let payload: FastBacktestRequest;
    try {
      payload = {
        strategyCode: String(model['strategyCode'] ?? ''),
        symbol: String(model['symbol'] ?? ''),
        timeframe: String(model['timeframe'] ?? ''),
        source: optionalText(model['source']),
        marketType: optionalText(model['marketType']),
        feedCode: optionalText(model['feedCode']),
        fromTime: isoText(model['fromTime']),
        toTime: isoText(model['toTime']),
        startIndex: numberOrUndefined(model['startIndex']),
        endIndex: numberOrUndefined(model['endIndex']),
        warmupBars: numberOrUndefined(model['warmupBars']),
        initialCapital: numberOrUndefined(model['initialCapital']),
        riskPerTradePct: numberOrUndefined(model['riskPerTradePct']),
        feeRate: numberOrUndefined(model['feeRate']),
        slippageRate: numberOrUndefined(model['slippageRate']),
        params: parseJson(model['paramsText'], {})
      };
    } catch {
      this.toastService.error(this.i18nService.t('tradeBot.message.invalidJson'));
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.loadingService
      .track(this.service.runFastBacktest(payload))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.fastBacktest.set(response);
          this.error.set(null);
          this.pushHistory('FAST_BACKTEST', payload as unknown as Record<string, unknown>, response as unknown as Record<string, unknown>);
        },
        error: () => {
          const message = this.i18nService.t('tradeBot.message.sandboxFailed');
          this.error.set(message);
          this.toastService.error(message);
        }
      });
  }

  evaluate(model: Record<string, unknown>): void {
    let payload: EvaluateBarRequest;
    try {
      payload = {
        strategyCode: String(model['strategyCode'] ?? ''),
        symbol: String(model['symbol'] ?? ''),
        timeframe: String(model['timeframe'] ?? ''),
        source: optionalText(model['source']),
        marketType: optionalText(model['marketType']),
        feedCode: optionalText(model['feedCode']),
        fromTime: isoText(model['fromTime']),
        toTime: isoText(model['toTime']),
        index: Number(model['index'] ?? 0),
        params: parseJson(model['paramsText'], {})
      };
    } catch {
      this.toastService.error(this.i18nService.t('tradeBot.message.invalidJson'));
      return;
    }

    this.evaluateLoading.set(true);
    this.error.set(null);
    this.loadingService
      .track(this.service.evaluateBar(payload))
      .pipe(finalize(() => this.evaluateLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.evaluateBar.set(response);
          this.error.set(null);
          this.pushHistory('EVALUATE_BAR', payload as unknown as Record<string, unknown>, response as unknown as Record<string, unknown>);
        },
        error: () => {
          const message = this.i18nService.t('tradeBot.message.evaluateFailed');
          this.error.set(message);
          this.toastService.error(message);
        }
      });
  }

  fastBacktestJson(): FastBacktestResponse | null {
    return this.fastBacktest();
  }

  evaluateBarJson(): EvaluateBarResponse | null {
    return this.evaluateBar();
  }

  openRaw(row?: SandboxHistoryRow): void {
    this.selectedRaw.set(row ?? null);
    this.rawDialogVisible.set(true);
  }

  closeRaw(): void {
    this.rawDialogVisible.set(false);
    this.selectedRaw.set(null);
  }

  handleRawOpenChange(open: boolean): void {
    if (!open) {
      this.closeRaw();
    }
  }

  private pushHistory(type: SandboxHistoryType, request: Record<string, unknown>, response: Record<string, unknown>): void {
    const row: SandboxHistoryRow = {
      id: crypto.randomUUID(),
      type,
      strategyCode: String(request['strategyCode'] ?? ''),
      symbol: String(request['symbol'] ?? ''),
      timeframe: String(request['timeframe'] ?? ''),
      executedAt: new Date().toISOString(),
      status: 'SUCCESS',
      request,
      response
    };
    this.history.set([row, ...this.history()].slice(0, 25));
  }

  private loadStrategyOptions(): void {
    this.tradingSystemService
      .getStrategyConfigs({ status: 'ACTIVE' })
      .pipe(catchError(() => of([])))
      .subscribe((strategies) => {
        this.formContext = {
          ...this.formContext,
          extra: {
            ...this.formContext.extra,
            strategyOptions: strategies.map((strategy) => ({
              label: `${strategy.code} - ${strategy.strategyVersion}`,
              value: strategy.code
            }))
          }
        };
      });
  }
}

function optionalText(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function numberOrUndefined(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function isoText(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value ?? '');
}

function metricValue(record: Record<string, unknown>, keys: string[]): string | number {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      const value = record[key];
      if (typeof value === 'string' || typeof value === 'number') {
        return value;
      }
      if (typeof value === 'boolean') {
        return String(value);
      }
      return JSON.stringify(value);
    }
  }
  return '-';
}

function summarizeRecord(record: unknown): string {
  if (!record || typeof record !== 'object') {
    return '-';
  }
  const source = record as Record<string, unknown>;
  const summary = source['action'] ?? source['signal'] ?? source['decision'] ?? source['side'] ?? Object.keys(source).slice(0, 3).join(', ');
  return summary ? String(summary) : '-';
}
