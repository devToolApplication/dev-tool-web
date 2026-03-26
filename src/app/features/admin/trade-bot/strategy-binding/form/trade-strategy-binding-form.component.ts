import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { ExchangeResponse, StrategyResponse, SymbolResponse } from '../../../../../core/models/trade-bot/reference-data.model';
import {
  TradeStrategyBindingCreateDto,
  TradeStrategyBindingResponse,
  TradeStrategyBindingUpdateDto
} from '../../../../../core/models/trade-bot/trade-strategy-binding.model';
import { ReferenceDataService } from '../../../../../core/services/trade-bot-service/reference-data.service';
import { TradeStrategyBindingService } from '../../../../../core/services/trade-bot-service/trade-strategy-binding.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import {
  MARKET_TYPE_OPTIONS,
  STRATEGY_CONFIG_DEFAULTS,
  TRADE_BOT_BINDING_ROUTES,
  TRADE_SIDE_MODE_OPTIONS,
  TRADE_STRATEGY_BINDING_INITIAL_VALUE
} from '../../trade-bot-admin.constants';

interface TradeStrategyBindingFormValue {
  name: string;
  exchangeCode: string;
  symbolCode: string;
  strategyCode: string;
  marketType: string;
  tradeSideMode: 'BOTH' | 'LONG_ONLY' | 'SHORT_ONLY';
  providerSymbol: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETE';
  timezone: string;
  firstM15CandleStart: string;
  baseTimeframe: string;
  triggerTimeframe: string;
  breakoutConfirmByClose: boolean;
  entryMode: string;
  slMode: string;
  tpRr: number;
  maxTradesPerDay: number;
  strategyValidity: string;
}

type SelectOption = { label: string; value: string };

@Component({
  selector: 'app-trade-strategy-binding-form',
  standalone: false,
  templateUrl: './trade-strategy-binding-form.component.html'
})
export class TradeStrategyBindingFormComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create', extra: { exchangeOptions: [], symbolOptions: [], strategyOptions: [] } };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'name', label: 'Binding Name', width: 'full' },
      { type: 'select', name: 'exchangeCode', label: 'Exchange', width: '1/3', optionsExpression: 'context.extra?.exchangeOptions || []', validation: [Rules.required('Exchange is required')] },
      { type: 'select', name: 'symbolCode', label: 'Symbol', width: '1/3', optionsExpression: 'context.extra?.symbolOptions || []', validation: [Rules.required('Symbol is required')] },
      { type: 'select', name: 'strategyCode', label: 'Strategy', width: '1/3', optionsExpression: 'context.extra?.strategyOptions || []', validation: [Rules.required('Strategy is required')] },
      { type: 'select', name: 'marketType', label: 'Market Type', width: '1/3', options: [...MARKET_TYPE_OPTIONS], validation: [Rules.required('Market type is required')] },
      { type: 'select', name: 'tradeSideMode', label: 'Trade Side Mode', width: '1/3', options: [...TRADE_SIDE_MODE_OPTIONS], validation: [Rules.required('Trade side mode is required')] },
      { type: 'text', name: 'providerSymbol', label: 'Provider Symbol', width: '1/3', validation: [Rules.required('Provider symbol is required')] },
      { type: 'select', name: 'status', label: 'Status', width: '1/3', options: [...SYSTEM_STATUS_OPTIONS], validation: [Rules.required('Status is required')] },
      { type: 'textarea', name: 'description', label: 'Description', width: 'full' },
      { type: 'text', name: 'timezone', label: 'Timezone', width: '1/3', validation: [Rules.required('Timezone is required')] },
      { type: 'text', name: 'firstM15CandleStart', label: 'First M15 Start', width: '1/3', validation: [Rules.required('First candle start is required')] },
      { type: 'text', name: 'baseTimeframe', label: 'Base Timeframe', width: '1/3', validation: [Rules.required('Base timeframe is required')] },
      { type: 'text', name: 'triggerTimeframe', label: 'Trigger Timeframe', width: '1/3', validation: [Rules.required('Trigger timeframe is required')] },
      { type: 'checkbox', name: 'breakoutConfirmByClose', label: 'Breakout Confirm By Close', width: '1/3' },
      { type: 'text', name: 'entryMode', label: 'Entry Mode', width: '1/3', validation: [Rules.required('Entry mode is required')] },
      { type: 'text', name: 'slMode', label: 'SL Mode', width: '1/3', validation: [Rules.required('SL mode is required')] },
      { type: 'number', name: 'tpRr', label: 'TP RR', width: '1/3', validation: [Rules.required('TP RR is required')] },
      { type: 'number', name: 'maxTradesPerDay', label: 'Max Trades / Day', width: '1/3', validation: [Rules.required('Max trades per day is required')] },
      { type: 'text', name: 'strategyValidity', label: 'Strategy Validity', width: '1/3', validation: [Rules.required('Strategy validity is required')] }
    ]
  };

  editId: string | null = null;
  loading = false;
  readonly formVisible = signal(true);
  formInitialValue: TradeStrategyBindingFormValue = { ...TRADE_STRATEGY_BINDING_INITIAL_VALUE };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: TradeStrategyBindingService,
    private readonly referenceDataService: ReferenceDataService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadReferenceData();
  }

  onSubmitForm(model: TradeStrategyBindingFormValue): void {
    const payload = this.toPayload(model);
    const request$ = this.editId ? this.service.update(this.editId, payload as TradeStrategyBindingUpdateDto) : this.service.create(payload);
    this.loading = true;
    this.loadingService.track(request$).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.toastService.success(this.editId ? 'Update binding successfully' : 'Create binding successfully');
        void this.router.navigate([TRADE_BOT_BINDING_ROUTES.list]);
      },
      error: () => this.toastService.error('Save binding failed')
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
          this.bindRouteMode();
        },
        error: () => {
          this.toastService.error('Load reference data failed');
          this.bindRouteMode();
        }
      });
  }

  private bindRouteMode(): void {
    this.applyRouteMode(this.route.snapshot.paramMap.get('id'));
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id === this.editId) {
        return;
      }
      this.applyRouteMode(id);
    });
  }

  private applyRouteMode(id: string | null): void {
    if (!id) {
      this.editId = null;
      this.formContext.mode = 'create';
      this.formInitialValue = { ...TRADE_STRATEGY_BINDING_INITIAL_VALUE };
      this.rerenderForm();
      return;
    }

    this.editId = id;
    this.formContext.mode = 'edit';
    this.loading = true;
    this.loadingService.track(this.service.getById(id)).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (detail: TradeStrategyBindingResponse) => {
        this.formInitialValue = this.toFormValue(detail);
        this.rerenderForm();
      },
      error: () => {
        this.toastService.error('Load binding detail failed');
        void this.router.navigate([TRADE_BOT_BINDING_ROUTES.list]);
      }
    });
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    window.setTimeout(() => this.formVisible.set(true));
  }

  private toFormValue(detail: TradeStrategyBindingResponse): TradeStrategyBindingFormValue {
    const config = detail.configJson ?? {};
    return {
      name: detail.name ?? '',
      exchangeCode: detail.exchangeCode,
      symbolCode: detail.symbolCode,
      strategyCode: detail.strategyCode,
      marketType: detail.marketType,
      tradeSideMode: detail.tradeSideMode,
      providerSymbol: detail.providerSymbol,
      description: detail.description ?? '',
      status: detail.status,
      timezone: String(config['timezone'] ?? STRATEGY_CONFIG_DEFAULTS.timezone),
      firstM15CandleStart: String(config['first_m15_candle_start'] ?? STRATEGY_CONFIG_DEFAULTS.firstM15CandleStart),
      baseTimeframe: String(config['base_timeframe'] ?? STRATEGY_CONFIG_DEFAULTS.baseTimeframe),
      triggerTimeframe: String(config['trigger_timeframe'] ?? STRATEGY_CONFIG_DEFAULTS.triggerTimeframe),
      breakoutConfirmByClose: Boolean(config['breakout_confirm_by_close'] ?? STRATEGY_CONFIG_DEFAULTS.breakoutConfirmByClose),
      entryMode: String(config['entry_mode'] ?? STRATEGY_CONFIG_DEFAULTS.entryMode),
      slMode: String(config['sl_mode'] ?? STRATEGY_CONFIG_DEFAULTS.slMode),
      tpRr: Number(config['tp_rr'] ?? STRATEGY_CONFIG_DEFAULTS.tpRr),
      maxTradesPerDay: Number(config['max_trades_per_day'] ?? STRATEGY_CONFIG_DEFAULTS.maxTradesPerDay),
      strategyValidity: String(config['strategy_validity'] ?? STRATEGY_CONFIG_DEFAULTS.strategyValidity)
    };
  }

  private toPayload(model: TradeStrategyBindingFormValue): TradeStrategyBindingCreateDto {
    return {
      name: model.name?.trim() || undefined,
      exchangeCode: model.exchangeCode,
      symbolCode: model.symbolCode,
      strategyCode: model.strategyCode,
      marketType: model.marketType,
      tradeSideMode: model.tradeSideMode,
      providerSymbol: model.providerSymbol,
      description: model.description,
      status: model.status,
      configJson: {
        timezone: model.timezone,
        first_m15_candle_start: model.firstM15CandleStart,
        base_timeframe: model.baseTimeframe,
        trigger_timeframe: model.triggerTimeframe,
        breakout_confirm_by_close: model.breakoutConfirmByClose,
        entry_mode: model.entryMode,
        sl_mode: model.slMode,
        tp_rr: model.tpRr,
        max_trades_per_day: model.maxTradesPerDay,
        strategy_validity: model.strategyValidity
      }
    };
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
}
