import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';
import { BacktestRunDto } from '../../../../../core/models/trade-bot/backtest.model';
import { ExchangeResponse, StrategyResponse, SymbolResponse } from '../../../../../core/models/trade-bot/reference-data.model';
import { TradeStrategyBindingResponse } from '../../../../../core/models/trade-bot/trade-strategy-binding.model';
import { BacktestService } from '../../../../../core/services/trade-bot-service/backtest.service';
import { ReferenceDataService } from '../../../../../core/services/trade-bot-service/reference-data.service';
import { TradeStrategyBindingService } from '../../../../../core/services/trade-bot-service/trade-strategy-binding.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { MARKET_TYPE_OPTIONS, TRADE_BOT_BACKTEST_ROUTES, TRADE_SIDE_MODE_OPTIONS } from '../../trade-bot-admin.constants';
import { STRATEGY_MANAGEMENT_ROUTES } from '../../strategy-binding/strategy-management.constants';
import { BACKTEST_RISK_MODE_OPTIONS, BacktestRiskMode, TradeBotTextKey } from '../../strategy-binding/shared/strategy-ui.enums';

interface BacktestRunFormValue {
  bindingId: string;
  exchangeId: string;
  symbolId: string;
  strategyId: string;
  marketType: string;
  tradeSideMode: 'BOTH' | 'LONG_ONLY' | 'SHORT_ONLY';
  fromDate: Date | null;
  toDate: Date | null;
  initialBalance: number;
  feeRate: number;
  slippageRate: number;
  riskMode: BacktestRiskMode;
  fixedRiskAmount: number;
  riskPercentPerTrade: number;
}

type SelectOption = { label: string; value: string };

@Component({
  selector: 'app-backtest-run',
  standalone: false,
  templateUrl: './backtest-run.component.html'
})
export class BacktestRunComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create', extra: { bindingOptions: [], exchangeOptions: [], symbolOptions: [], strategyOptions: [] } };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'select', name: 'bindingId', label: 'tradeBot.backtest.run.field.binding', width: 'full', optionsExpression: 'context.extra?.bindingOptions || []', validation: [Rules.required('tradeBot.backtest.run.validation.bindingRequired')] },
      { type: 'select', name: 'exchangeId', label: 'tradeBot.strategy.field.exchange', width: '1/3', optionsExpression: 'context.extra?.exchangeOptions || []', validation: [Rules.required('tradeBot.backtest.run.validation.exchangeRequired')] },
      { type: 'select', name: 'symbolId', label: 'tradeBot.strategy.field.symbol', width: '1/3', optionsExpression: 'context.extra?.symbolOptions || []', validation: [Rules.required('tradeBot.backtest.run.validation.symbolRequired')] },
      { type: 'select', name: 'strategyId', label: 'tradeBot.strategy.field.strategyName', width: '1/3', optionsExpression: 'context.extra?.strategyOptions || []', validation: [Rules.required('tradeBot.backtest.run.validation.strategyRequired')] },
      { type: 'select', name: 'marketType', label: 'tradeBot.strategy.field.marketType', width: '1/3', options: [...MARKET_TYPE_OPTIONS], validation: [Rules.required('tradeBot.backtest.run.validation.marketTypeRequired')] },
      { type: 'select', name: 'tradeSideMode', label: 'tradeBot.strategy.field.tradeSideMode', width: '1/3', options: [...TRADE_SIDE_MODE_OPTIONS], validation: [Rules.required('tradeBot.backtest.run.validation.tradeSideModeRequired')] },
      { type: 'number', name: 'initialBalance', label: 'tradeBot.replay.field.initialBalance', width: '1/3', validation: [Rules.required('tradeBot.backtest.run.validation.initialBalanceRequired')] },
      { type: 'date', name: 'fromDate', label: 'fromDate', width: '1/3', validation: [Rules.required('tradeBot.backtest.run.validation.fromDateRequired')] },
      { type: 'date', name: 'toDate', label: 'toDate', width: '1/3', validation: [Rules.required('tradeBot.backtest.run.validation.toDateRequired')] },
      { type: 'number', name: 'feeRate', label: 'tradeBot.replay.field.feeRate', width: '1/3' },
      { type: 'number', name: 'slippageRate', label: 'tradeBot.replay.field.slippage', width: '1/3' },
      {
        type: 'radio',
        name: 'riskMode',
        label: 'tradeBot.replay.field.riskMode',
        width: '1/3',
        options: [...BACKTEST_RISK_MODE_OPTIONS],
        validation: [Rules.required('tradeBot.backtest.run.validation.riskModeRequired')]
      },
      {
        type: 'number',
        name: 'fixedRiskAmount',
        label: 'tradeBot.backtest.run.field.fixedRiskAmount',
        width: '1/3',
        rules: { visible: 'model.riskMode === "FIXED_AMOUNT"' },
        validation: [
          Rules.required('tradeBot.backtest.run.validation.fixedRiskAmountRequired'),
          Rules.min(0.01, 'tradeBot.backtest.run.validation.riskValuePositive')
        ]
      },
      {
        type: 'number',
        name: 'riskPercentPerTrade',
        label: 'tradeBot.replay.field.riskPercentRemainingBalance',
        width: '1/3',
        rules: { visible: 'model.riskMode === "EQUITY_PERCENT"' },
        validation: [
          Rules.required('tradeBot.backtest.run.validation.riskPercentRequired'),
          Rules.min(0.01, 'tradeBot.backtest.run.validation.riskValuePositive')
        ]
      }
    ]
  };

  readonly formVisible = signal(true);
  loading = false;
  bindings: TradeStrategyBindingResponse[] = [];
  formInitialValue: BacktestRunFormValue = {
    bindingId: '',
    exchangeId: '',
    symbolId: '',
    strategyId: '',
    marketType: 'FOREX',
    tradeSideMode: 'BOTH',
    fromDate: new Date(),
    toDate: new Date(),
    initialBalance: 10000,
    feeRate: 0,
    slippageRate: 0,
    riskMode: BacktestRiskMode.EQUITY_PERCENT,
    fixedRiskAmount: 100,
    riskPercentPerTrade: 1
  };

  constructor(
    private readonly referenceDataService: ReferenceDataService,
    private readonly bindingService: TradeStrategyBindingService,
    private readonly backtestService: BacktestService,
    private readonly i18nService: I18nService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadReferenceData();
  }

  onSubmitForm(model: BacktestRunFormValue): void {
    if (!model.fromDate || !model.toDate) {
      this.toastService.error(this.i18nService.t('tradeBot.invalidTimeRange'));
      return;
    }

    const binding = this.bindings.find((item) => item.id === model.bindingId);
    if (!binding) {
      this.toastService.error(this.i18nService.t('tradeBot.backtest.run.validation.bindingRequired'));
      return;
    }

    const payload: BacktestRunDto = {
      bindingId: binding.id,
      exchangeId: binding.exchangeId ?? model.exchangeId,
      symbolId: binding.symbolId ?? model.symbolId,
      strategyId: binding.strategyId ?? model.strategyId,
      marketType: binding.marketType,
      tradeSideMode: binding.tradeSideMode,
      fromDate: this.toLocalDateString(model.fromDate),
      toDate: this.toLocalDateString(model.toDate),
      initialBalance: Number(model.initialBalance),
      feeRate: Number(model.feeRate ?? 0),
      slippageRate: Number(model.slippageRate ?? 0),
      riskConfig: this.buildRiskConfig(model)
    };

    this.loading = true;
    this.loadingService.track(this.backtestService.run(payload)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (job) => {
        this.toastService.success(this.i18nService.t(TradeBotTextKey.RunBacktestSuccess));
        if (job.bindingId) {
          void this.router.navigate([STRATEGY_MANAGEMENT_ROUTES.backtest(job.bindingId)], { queryParams: { jobId: job.id } });
          return;
        }
        void this.router.navigate([`${TRADE_BOT_BACKTEST_ROUTES.list}/${job.id}`]);
      },
      error: () => this.toastService.error(this.i18nService.t(TradeBotTextKey.RunBacktestFailed))
    });
  }

  private loadReferenceData(): void {
    this.loading = true;
    this.loadingService
      .track(
        forkJoin({
          bindings: this.bindingService.getPage(0, 200, ['exchangeCode,asc']),
          exchanges: this.referenceDataService.getExchanges(),
          symbols: this.referenceDataService.getSymbols(),
          strategies: this.referenceDataService.getStrategies()
        })
      )
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ bindings, exchanges, symbols, strategies }) => {
          this.bindings = bindings.data ?? [];
          const firstBinding = this.bindings[0];
          this.formContext.extra = {
            bindingOptions: this.mapBindingOptions(this.bindings),
            exchangeOptions: this.mapExchangeOptions(exchanges),
            symbolOptions: this.mapSymbolOptions(symbols),
            strategyOptions: this.mapStrategyOptions(strategies)
          };
          this.formInitialValue = {
            ...this.formInitialValue,
            bindingId: firstBinding?.id ?? '',
            exchangeId: firstBinding?.exchangeId ?? exchanges[0]?.id ?? '',
            symbolId: firstBinding?.symbolId ?? symbols[0]?.id ?? '',
            strategyId: firstBinding?.strategyId ?? strategies[0]?.id ?? '',
            marketType: firstBinding?.marketType ?? 'FOREX',
            tradeSideMode: firstBinding?.tradeSideMode ?? 'BOTH'
          };
          this.rerenderForm();
        },
        error: () => this.toastService.error(this.i18nService.t('loadError'))
      });
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    window.setTimeout(() => this.formVisible.set(true));
  }

  private buildRiskConfig(model: BacktestRunFormValue): Record<string, unknown> {
    if (model.riskMode === BacktestRiskMode.FIXED_AMOUNT) {
      return {
        riskMode: BacktestRiskMode.FIXED_AMOUNT,
        fixedRiskAmount: Number(model.fixedRiskAmount)
      };
    }

    return {
      riskMode: BacktestRiskMode.EQUITY_PERCENT,
      riskPercentPerTrade: Number(model.riskPercentPerTrade)
    };
  }

  private mapExchangeOptions(items: ExchangeResponse[]): SelectOption[] {
    return items.map((item) => ({ label: `${item.code} - ${item.name}`, value: item.id }));
  }

  private mapBindingOptions(items: TradeStrategyBindingResponse[]): SelectOption[] {
    return items.map((item) => ({
      label: `${item.exchangeCode} - ${item.symbolCode} - ${item.strategyServiceName} - ${item.ruleCode ?? this.i18nService.t('tradeBot.rule.none')}`,
      value: item.id
    }));
  }

  private mapSymbolOptions(items: SymbolResponse[]): SelectOption[] {
    return items.map((item) => ({ label: `${item.code} (${item.marketType})`, value: item.id }));
  }

  private mapStrategyOptions(items: StrategyResponse[]): SelectOption[] {
    return items.map((item) => ({ label: `${item.serviceName} - ${item.name}`, value: item.id }));
  }

  private toLocalDateString(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
