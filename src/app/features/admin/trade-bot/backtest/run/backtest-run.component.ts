import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';
import { BacktestRunDto } from '../../../../../core/models/trade-bot/backtest.model';
import { ExchangeResponse, StrategyResponse, SymbolResponse } from '../../../../../core/models/trade-bot/reference-data.model';
import { BacktestService } from '../../../../../core/services/trade-bot-service/backtest.service';
import { ReferenceDataService } from '../../../../../core/services/trade-bot-service/reference-data.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { MARKET_TYPE_OPTIONS, TRADE_BOT_BACKTEST_ROUTES, TRADE_SIDE_MODE_OPTIONS } from '../../trade-bot-admin.constants';
import { STRATEGY_MANAGEMENT_ROUTES } from '../../strategies/strategy-management.constants';
import { TradeBotTextKey } from '../../strategies/shared/strategy-ui.enums';

interface BacktestRunFormValue {
  exchangeCode: string;
  symbolCode: string;
  strategyCode: string;
  marketType: string;
  tradeSideMode: 'BOTH' | 'LONG_ONLY' | 'SHORT_ONLY';
  fromDate: Date | null;
  toDate: Date | null;
  initialBalance: number;
  feeRate: number;
  slippageRate: number;
  fixedQuantity: number | null;
  fixedRiskAmount: number | null;
  riskPercentPerTrade: number | null;
  allowCompounding: boolean;
}

type SelectOption = { label: string; value: string };

@Component({
  selector: 'app-backtest-run',
  standalone: false,
  templateUrl: './backtest-run.component.html'
})
export class BacktestRunComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create', extra: { exchangeOptions: [], symbolOptions: [], strategyOptions: [] } };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'select', name: 'exchangeCode', label: 'Exchange', width: '1/3', optionsExpression: 'context.extra?.exchangeOptions || []', validation: [Rules.required('Exchange is required')] },
      { type: 'select', name: 'symbolCode', label: 'Symbol', width: '1/3', optionsExpression: 'context.extra?.symbolOptions || []', validation: [Rules.required('Symbol is required')] },
      { type: 'select', name: 'strategyCode', label: 'Strategy', width: '1/3', optionsExpression: 'context.extra?.strategyOptions || []', validation: [Rules.required('Strategy is required')] },
      { type: 'select', name: 'marketType', label: 'Market Type', width: '1/3', options: [...MARKET_TYPE_OPTIONS], validation: [Rules.required('Market type is required')] },
      { type: 'select', name: 'tradeSideMode', label: 'Trade Side Mode', width: '1/3', options: [...TRADE_SIDE_MODE_OPTIONS], validation: [Rules.required('Trade side mode is required')] },
      { type: 'number', name: 'initialBalance', label: 'Initial Balance', width: '1/3', validation: [Rules.required('Initial balance is required')] },
      { type: 'date', name: 'fromDate', label: 'From Date', width: '1/3', validation: [Rules.required('From date is required')] },
      { type: 'date', name: 'toDate', label: 'To Date', width: '1/3', validation: [Rules.required('To date is required')] },
      { type: 'number', name: 'feeRate', label: 'Fee Rate', width: '1/3' },
      { type: 'number', name: 'slippageRate', label: 'Slippage Rate', width: '1/3' },
      { type: 'number', name: 'fixedQuantity', label: 'Fixed Quantity', width: '1/3' },
      { type: 'number', name: 'fixedRiskAmount', label: 'Fixed Risk Amount', width: '1/3' },
      { type: 'number', name: 'riskPercentPerTrade', label: 'Risk % / Trade', width: '1/3' },
      { type: 'checkbox', name: 'allowCompounding', label: 'Allow Compounding', width: '1/3' }
    ]
  };

  readonly formVisible = signal(true);
  loading = false;
  formInitialValue: BacktestRunFormValue = {
    exchangeCode: 'OANDA',
    symbolCode: 'XAUUSD',
    strategyCode: 'FIRST_M15_NEWYORK',
    marketType: 'FOREX',
    tradeSideMode: 'BOTH',
    fromDate: new Date(),
    toDate: new Date(),
    initialBalance: 10000,
    feeRate: 0,
    slippageRate: 0,
    fixedQuantity: null,
    fixedRiskAmount: 100,
    riskPercentPerTrade: null,
    allowCompounding: true
  };

  constructor(
    private readonly referenceDataService: ReferenceDataService,
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

    const payload: BacktestRunDto = {
      exchangeCode: model.exchangeCode,
      symbolCode: model.symbolCode,
      strategyCode: model.strategyCode,
      marketType: model.marketType,
      tradeSideMode: model.tradeSideMode,
      fromDate: this.toLocalDateString(model.fromDate),
      toDate: this.toLocalDateString(model.toDate),
      initialBalance: Number(model.initialBalance),
      feeRate: Number(model.feeRate ?? 0),
      slippageRate: Number(model.slippageRate ?? 0),
      riskConfig: {
        fixedQuantity: model.fixedQuantity,
        fixedRiskAmount: model.fixedRiskAmount,
        riskPercentPerTrade: model.riskPercentPerTrade,
        allowCompounding: model.allowCompounding
      }
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
          exchanges: this.referenceDataService.getExchanges(),
          symbols: this.referenceDataService.getSymbols(),
          strategies: this.referenceDataService.getStrategies()
        })
      )
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ exchanges, symbols, strategies }) => {
          this.formContext.extra = {
            exchangeOptions: this.mapExchangeOptions(exchanges),
            symbolOptions: this.mapSymbolOptions(symbols),
            strategyOptions: this.mapStrategyOptions(strategies)
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

  private mapExchangeOptions(items: ExchangeResponse[]): SelectOption[] {
    return items.map((item) => ({ label: `${item.code} - ${item.name}`, value: item.code }));
  }

  private mapSymbolOptions(items: SymbolResponse[]): SelectOption[] {
    return items.map((item) => ({ label: `${item.code} (${item.marketType})`, value: item.code }));
  }

  private mapStrategyOptions(items: StrategyResponse[]): SelectOption[] {
    return items.map((item) => ({ label: `${item.code} - ${item.name}`, value: item.code }));
  }

  private toLocalDateString(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
