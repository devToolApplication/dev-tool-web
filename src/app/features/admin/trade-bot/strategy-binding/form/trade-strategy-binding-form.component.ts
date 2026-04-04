import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';
import { SYSTEM_STATUS_OPTIONS } from '../../../../../core/constants/system.constants';
import { ExchangeResponse, StrategyResponse, SymbolResponse } from '../../../../../core/models/trade-bot/reference-data.model';
import { StrategyRuleResponse } from '../../../../../core/models/trade-bot/strategy-rule.model';
import {
  TradeStrategyBindingCreateDto,
  TradeStrategyBindingResponse,
  TradeStrategyBindingUpdateDto
} from '../../../../../core/models/trade-bot/trade-strategy-binding.model';
import { ReferenceDataService } from '../../../../../core/services/trade-bot-service/reference-data.service';
import { StrategyRuleService } from '../../../../../core/services/trade-bot-service/strategy-rule.service';
import { TradeStrategyBindingService } from '../../../../../core/services/trade-bot-service/trade-strategy-binding.service';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormConfig, FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { Rules } from '../../../../../shared/ui/form-input/utils/validation-rules';
import { MARKET_TYPE_OPTIONS, TRADE_BOT_BINDING_ROUTES, TRADE_SIDE_MODE_OPTIONS } from '../../trade-bot-admin.constants';

interface TradeStrategyBindingFormValue {
  name: string;
  exchangeId: string;
  symbolId: string;
  strategyId: string;
  ruleId: string;
  marketType: string;
  tradeSideMode: 'BOTH' | 'LONG_ONLY' | 'SHORT_ONLY';
  providerSymbol: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETE';
}

type SelectOption = { label: string; value: string };

@Component({
  selector: 'app-trade-strategy-binding-form',
  standalone: false,
  templateUrl: './trade-strategy-binding-form.component.html'
})
export class TradeStrategyBindingFormComponent implements OnInit {
  readonly formContext: FormContext = { user: null, mode: 'create', extra: { exchangeOptions: [], symbolOptions: [], strategyOptions: [], ruleOptions: [] } };
  readonly formConfig: FormConfig = {
    fields: [
      { type: 'text', name: 'name', label: 'tradeBot.strategy.field.bindingName', width: 'full', validation: [Rules.required('tradeBot.strategyBinding.validation.bindingNameRequired')] },
      { type: 'select', name: 'exchangeId', label: 'tradeBot.strategy.field.exchange', width: '1/3', optionsExpression: 'context.extra?.exchangeOptions || []', validation: [Rules.required('tradeBot.strategyBinding.validation.exchangeRequired')] },
      { type: 'select', name: 'symbolId', label: 'tradeBot.strategy.field.symbol', width: '1/3', optionsExpression: 'context.extra?.symbolOptions || []', validation: [Rules.required('tradeBot.strategyBinding.validation.symbolRequired')] },
      { type: 'select', name: 'strategyId', label: 'tradeBot.strategy.field.strategyName', width: '1/3', optionsExpression: 'context.extra?.strategyOptions || []', validation: [Rules.required('tradeBot.strategyBinding.validation.strategyRequired')] },
      { type: 'select', name: 'ruleId', label: 'tradeBot.strategy.field.rule', width: '1/3', optionsExpression: 'context.extra?.ruleOptions || []', validation: [Rules.required('tradeBot.strategyBinding.validation.ruleRequired')] },
      { type: 'select', name: 'marketType', label: 'tradeBot.strategy.field.marketType', width: '1/3', options: [...MARKET_TYPE_OPTIONS], validation: [Rules.required('tradeBot.strategyBinding.validation.marketTypeRequired')] },
      { type: 'select', name: 'tradeSideMode', label: 'tradeBot.strategy.field.tradeSideMode', width: '1/3', options: [...TRADE_SIDE_MODE_OPTIONS], validation: [Rules.required('tradeBot.strategyBinding.validation.tradeSideModeRequired')] },
      { type: 'text', name: 'providerSymbol', label: 'tradeBot.strategy.field.providerSymbol', width: '1/3', validation: [Rules.required('tradeBot.strategyBinding.validation.providerSymbolRequired')] },
      { type: 'select', name: 'status', label: 'tradeBot.strategy.field.status', width: '1/3', options: [...SYSTEM_STATUS_OPTIONS], validation: [Rules.required('tradeBot.strategyBinding.validation.statusRequired')] },
      { type: 'textarea', name: 'description', label: 'tradeBot.strategy.field.description', width: 'full' }
    ]
  };

  editId: string | null = null;
  loading = false;
  readonly formVisible = signal(true);
  formInitialValue: TradeStrategyBindingFormValue = {
    name: '',
    exchangeId: '',
    symbolId: '',
    strategyId: '',
    ruleId: '',
    marketType: 'FOREX',
    tradeSideMode: 'BOTH',
    providerSymbol: '',
    description: '',
    status: 'ACTIVE'
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: TradeStrategyBindingService,
    private readonly referenceDataService: ReferenceDataService,
    private readonly ruleService: StrategyRuleService,
    private readonly i18nService: I18nService,
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
        this.toastService.success(this.i18nService.t(this.editId ? 'tradeBot.strategyBinding.toast.updateSuccess' : 'tradeBot.strategyBinding.toast.createSuccess'));
        void this.router.navigate([TRADE_BOT_BINDING_ROUTES.list]);
      },
      error: (error) => this.toastService.error(error?.error?.errorMessage ?? this.i18nService.t('tradeBot.strategyBinding.toast.saveError'))
    });
  }

  private loadReferenceData(): void {
    this.loading = true;
    this.loadingService
      .track(
        forkJoin({
          exchanges: this.referenceDataService.getExchanges(),
          symbols: this.referenceDataService.getSymbols(),
          strategies: this.referenceDataService.getStrategies(),
          rules: this.ruleService.getAll()
        })
      )
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ exchanges, symbols, strategies, rules }) => {
          this.formContext.extra = {
            exchangeOptions: this.mapExchangeOptions(exchanges),
            symbolOptions: this.mapSymbolOptions(symbols),
            strategyOptions: this.mapStrategyOptions(strategies),
            ruleOptions: this.mapRuleOptions(rules)
          };
          this.bindRouteMode();
        },
        error: () => {
          this.toastService.error(this.i18nService.t('tradeBot.strategyBinding.toast.loadReferenceError'));
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
        this.toastService.error(this.i18nService.t('tradeBot.strategyBinding.toast.loadDetailError'));
        void this.router.navigate([TRADE_BOT_BINDING_ROUTES.list]);
      }
    });
  }

  private rerenderForm(): void {
    this.formVisible.set(false);
    window.setTimeout(() => this.formVisible.set(true));
  }

  private toFormValue(detail: TradeStrategyBindingResponse): TradeStrategyBindingFormValue {
    return {
      name: detail.name ?? '',
      exchangeId: detail.exchangeId ?? '',
      symbolId: detail.symbolId ?? '',
      strategyId: detail.strategyId ?? '',
      ruleId: detail.ruleId ?? '',
      marketType: detail.marketType,
      tradeSideMode: detail.tradeSideMode,
      providerSymbol: detail.providerSymbol,
      description: detail.description ?? '',
      status: detail.status
    };
  }

  private toPayload(model: TradeStrategyBindingFormValue): TradeStrategyBindingCreateDto {
    return {
      name: model.name?.trim() || undefined,
      exchangeId: model.exchangeId,
      symbolId: model.symbolId,
      strategyId: model.strategyId,
      ruleId: model.ruleId,
      marketType: model.marketType,
      tradeSideMode: model.tradeSideMode,
      providerSymbol: model.providerSymbol,
      description: model.description,
      status: model.status
    };
  }

  private mapExchangeOptions(items: ExchangeResponse[]): SelectOption[] {
    return items.map((item) => ({ label: `${item.code} - ${item.name}`, value: item.id }));
  }

  private mapSymbolOptions(items: SymbolResponse[]): SelectOption[] {
    return items.map((item) => ({ label: `${item.code} (${item.marketType})`, value: item.id }));
  }

  private mapStrategyOptions(items: StrategyResponse[]): SelectOption[] {
    return items.map((item) => ({ label: `${item.serviceName} - ${item.name}`, value: item.id }));
  }

  private mapRuleOptions(items: StrategyRuleResponse[]): SelectOption[] {
    return items.map((item) => ({ label: `${item.code} - ${item.name}`, value: item.id }));
  }
}
