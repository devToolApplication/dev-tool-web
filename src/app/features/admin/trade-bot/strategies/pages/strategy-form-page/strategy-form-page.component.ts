import { DestroyRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Data, ParamMap, Router } from '@angular/router';
import { combineLatest, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StrategyResponse, SymbolResponse } from '../../../../../../core/models/trade-bot/reference-data.model';
import { StrategyRuleResponse } from '../../../../../../core/models/trade-bot/strategy-rule.model';
import { TradeStrategyBindingCreateDto, TradeStrategyBindingResponse } from '../../../../../../core/models/trade-bot/trade-strategy-binding.model';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { STRATEGY_MANAGEMENT_ROUTES, STRATEGY_FAMILY_LABELS } from '../../strategy-management.constants';
import { StrategyFormBuilders, StrategyGeneralInfoFormGroup } from '../../shared/strategy-form.builders';
import { StrategyFormFacade, StrategyFormPageContext, StrategySelectOption } from '../../shared/strategy-form.facade';
import { TradeBotTextKey } from '../../shared/strategy-ui.enums';
import { resolveStrategyUiMetadataByServiceName } from '../../shared/strategy-ui.registry';

@Component({
  selector: 'app-strategy-form-page',
  standalone: false,
  templateUrl: './strategy-form-page.component.html',
  styleUrl: './strategy-form-page.component.css'
})
export class StrategyFormPageComponent implements OnInit {
  readonly generalInfoForm: StrategyGeneralInfoFormGroup;
  readonly destroyRef = inject(DestroyRef);
  readonly TEXT = TradeBotTextKey;

  editId: string | null = null;
  loaded = false;
  loading = false;
  saving = false;

  strategyMeta = resolveStrategyUiMetadataByServiceName('FIRST_M15_NEWYORK');
  currentStrategy?: StrategyResponse;
  selectedRule?: StrategyRuleResponse;
  referenceSymbols: SymbolResponse[] = [];
  availableRules: StrategyRuleResponse[] = [];

  exchangeOptions: StrategySelectOption[] = [];
  symbolOptions: StrategySelectOption[] = [];
  ruleOptions: StrategySelectOption[] = [];
  marketTypeOptions: StrategySelectOption[] = [];
  tradeSideModeOptions: StrategySelectOption[] = [];
  statusOptions: StrategySelectOption[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly formBuilders: StrategyFormBuilders,
    private readonly facade: StrategyFormFacade,
    private readonly i18nService: I18nService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {
    this.generalInfoForm = this.formBuilders.createGeneralInfoForm();
  }

  ngOnInit(): void {
    this.generalInfoForm.controls.symbolId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((symbolId) => {
      this.prefillProviderSymbol(symbolId);
    });
    this.generalInfoForm.controls.ruleId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((ruleId) => {
      this.selectedRule = this.availableRules.find((item) => item.id === ruleId);
    });

    combineLatest([this.route.data, this.route.paramMap])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([data, params]) => this.loadPage(data, params));
  }

  get familyLabel(): string {
    return STRATEGY_FAMILY_LABELS[this.strategyMeta?.family ?? ''] ?? 'Strategy';
  }

  get routePathPreview(): string {
    if (!this.strategyMeta) {
      return STRATEGY_MANAGEMENT_ROUTES.createEntry;
    }
    return this.editId ? STRATEGY_MANAGEMENT_ROUTES.edit(this.editId) : STRATEGY_MANAGEMENT_ROUTES.createByPath(this.strategyMeta.routePath);
  }

  get ruleReady(): boolean {
    return Boolean(this.generalInfoForm.controls.ruleId.value);
  }

  save(): void {
    this.generalInfoForm.markAllAsTouched();

    if (this.generalInfoForm.invalid) {
      this.toastService.info(this.i18nService.t(TradeBotTextKey.ReviewStrategyBeforeSave));
      return;
    }

    const payload = this.buildPayload();
    this.saving = true;
    this.loadingService
      .track(this.facade.save(this.editId, payload))
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (binding) => {
          this.toastService.success(this.i18nService.t(this.editId ? TradeBotTextKey.UpdateStrategySuccess : TradeBotTextKey.SaveStrategySuccess));
          void this.router.navigate([STRATEGY_MANAGEMENT_ROUTES.edit(binding.id)]);
        },
        error: (error) => this.toastService.error(error?.error?.errorMessage ?? this.i18nService.t(TradeBotTextKey.SaveStrategyFailed))
      });
  }

  goBack(): void {
    void this.router.navigate([STRATEGY_MANAGEMENT_ROUTES.list]);
  }

  private loadPage(data: Data, params: ParamMap): void {
    const editId = params.get('id');
    const strategyServiceName = String(data['strategyServiceName'] ?? '');

    this.loading = true;
    this.loaded = false;

    const request$ = editId ? this.facade.loadEditContext(editId) : this.facade.loadCreateContext(strategyServiceName);
    this.loadingService
      .track(request$)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (context) => {
          this.editId = editId;
          this.applyContext(context, strategyServiceName);
          this.loaded = true;
        },
        error: () => {
          this.toastService.error(this.i18nService.t(TradeBotTextKey.LoadStrategyFormFailed));
          void this.router.navigate([STRATEGY_MANAGEMENT_ROUTES.list]);
        }
      });
  }

  private applyContext(context: StrategyFormPageContext, requestedStrategyServiceName: string): void {
    this.exchangeOptions = context.exchangeOptions;
    this.symbolOptions = context.symbolOptions;
    this.marketTypeOptions = context.marketTypeOptions;
    this.tradeSideModeOptions = context.tradeSideModeOptions;
    this.statusOptions = context.statusOptions;
    this.referenceSymbols = context.references.symbols;

    const strategyServiceName = context.binding?.strategyServiceName ?? requestedStrategyServiceName;
    this.currentStrategy = context.selectedStrategy ?? context.references.strategies.find((item) => item.serviceName === strategyServiceName);
    this.strategyMeta = resolveStrategyUiMetadataByServiceName(strategyServiceName);
    this.availableRules = context.references.rules.filter((item) => item.strategyServiceName === strategyServiceName);
    this.ruleOptions = this.availableRules.map((item) => ({ label: `${item.code} - ${item.name}`, value: item.id }));

    if (context.binding) {
      this.patchEditState(context.binding, this.currentStrategy);
      this.selectedRule = this.availableRules.find((item) => item.id === context.binding?.ruleId);
      return;
    }

    this.resetCreateState(strategyServiceName, this.currentStrategy, context.references.symbols);
    this.selectedRule = this.availableRules.find((item) => item.id === this.generalInfoForm.controls.ruleId.value);
  }

  private patchEditState(binding: TradeStrategyBindingResponse, strategy: StrategyResponse | undefined): void {
    this.generalInfoForm.reset(
      {
        name: binding.name ?? '',
        strategyId: binding.strategyId ?? '',
        strategyServiceName: binding.strategyServiceName ?? '',
        strategyName: strategy?.name ?? binding.strategyName ?? binding.strategyServiceName ?? '',
        ruleId: binding.ruleId ?? '',
        exchangeId: binding.exchangeId ?? '',
        symbolId: binding.symbolId ?? '',
        marketType: binding.marketType,
        tradeSideMode: binding.tradeSideMode,
        providerSymbol: binding.providerSymbol ?? '',
        description: binding.description ?? '',
        status: binding.status
      },
      { emitEvent: false }
    );
  }

  private resetCreateState(strategyServiceName: string, strategy: StrategyResponse | undefined, symbols: SymbolResponse[]): void {
    const defaultSymbol = symbols[0];
    const defaultRule = this.availableRules[0];
    this.generalInfoForm.reset(
      {
        name: '',
        strategyId: strategy?.id ?? '',
        strategyServiceName,
        strategyName: strategy?.name ?? strategyServiceName,
        ruleId: defaultRule?.id ?? '',
        exchangeId: this.exchangeOptions[0]?.value ?? '',
        symbolId: defaultSymbol?.id ?? '',
        marketType: defaultSymbol?.marketType ?? this.marketTypeOptions[0]?.value ?? '',
        tradeSideMode: 'BOTH',
        providerSymbol: defaultSymbol?.providerSymbol ?? defaultSymbol?.code ?? '',
        description: '',
        status: 'ACTIVE'
      },
      { emitEvent: false }
    );
  }

  private buildPayload(): TradeStrategyBindingCreateDto {
    const general = this.generalInfoForm.getRawValue();

    return {
      name: general.name.trim(),
      exchangeId: general.exchangeId,
      symbolId: general.symbolId,
      strategyId: general.strategyId,
      ruleId: general.ruleId,
      marketType: general.marketType,
      tradeSideMode: general.tradeSideMode,
      providerSymbol: general.providerSymbol.trim(),
      description: general.description.trim() || undefined,
      status: general.status
    };
  }

  private prefillProviderSymbol(symbolId: string): void {
    const symbol = this.referenceSymbols.find((item) => item.id === symbolId);
    if (!symbol) {
      return;
    }

    if (!this.generalInfoForm.controls.providerSymbol.dirty || !this.generalInfoForm.controls.providerSymbol.value) {
      this.generalInfoForm.controls.providerSymbol.setValue(symbol.providerSymbol ?? symbol.code, { emitEvent: false });
    }

    if (!this.generalInfoForm.controls.marketType.dirty) {
      this.generalInfoForm.controls.marketType.setValue(symbol.marketType, { emitEvent: false });
    }
  }
}
