import { DestroyRef, ViewChild, Component, OnInit, inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Data, ParamMap, Router } from '@angular/router';
import { combineLatest, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StrategyResponse, SymbolResponse } from '../../../../../core/models/trade-bot/reference-data.model';
import { TradeStrategyBindingCreateDto, TradeStrategyBindingResponse } from '../../../../../core/models/trade-bot/trade-strategy-binding.model';
import { I18nService } from '../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';
import { FormContext } from '../../../../../shared/ui/form-input/models/form-config.model';
import { STRATEGY_MANAGEMENT_ROUTES, STRATEGY_FAMILY_LABELS } from '../strategy-management.constants';
import { StrategyConfigDefinition, buildStrategySpecificConfigDefinition, mapApiConfigToStrategyConfig, mapStrategyConfigToApiPayload } from '../shared/strategy-config-form.factory';
import { StrategyFormBuilders, StrategyGeneralInfoFormGroup, StrategyRiskRewardFormGroup } from '../shared/strategy-form.builders';
import { StrategyFormFacade, StrategyFormPageContext, StrategySelectOption } from '../shared/strategy-form.facade';
import { StrategyEntryMode, StrategyStopLossMode, StrategyValidityMode, TradeBotTextKey } from '../shared/strategy-ui.enums';
import { resolveStrategyUiMetadataByCode } from '../shared/strategy-ui.registry';
import { StrategySpecificConfigSectionComponent } from '../shared/components/strategy-specific-config-section.component';

type BacktestDefaultsFormGroup = FormGroup<{
  initialBalance: FormControl<number>;
  feeRate: FormControl<number>;
  slippageRate: FormControl<number>;
  riskPerTradePct: FormControl<number>;
}>;

@Component({
  selector: 'app-strategy-form-page',
  standalone: false,
  templateUrl: './strategy-form-page.component.html',
  styleUrl: './strategy-form-page.component.css'
})
export class StrategyFormPageComponent implements OnInit {
  @ViewChild('strategyConfigSection') strategyConfigSection?: StrategySpecificConfigSectionComponent;

  readonly generalInfoForm: StrategyGeneralInfoFormGroup;
  readonly riskRewardForm: StrategyRiskRewardFormGroup;
  readonly backtestDefaultsForm: BacktestDefaultsFormGroup;
  readonly strategyConfigContext: FormContext = { user: null, mode: 'create', extra: {} };
  readonly destroyRef = inject(DestroyRef);
  readonly TEXT = TradeBotTextKey;

  editId: string | null = null;
  loaded = false;
  loading = false;
  saving = false;

  strategyMeta = resolveStrategyUiMetadataByCode('FIRST_M15_NEWYORK');
  strategyConfigDefinition: StrategyConfigDefinition = buildStrategySpecificConfigDefinition('FIRST_M15_NEWYORK');
  strategyConfigModel: Record<string, unknown> = { ...this.strategyConfigDefinition.initialValue };
  currentStrategy?: StrategyResponse;
  referenceSymbols: SymbolResponse[] = [];

  exchangeOptions: StrategySelectOption[] = [];
  symbolOptions: StrategySelectOption[] = [];
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
    this.riskRewardForm = this.formBuilders.createRiskRewardForm();
    this.backtestDefaultsForm = new FormGroup({
      initialBalance: new FormControl(10_000, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
      feeRate: new FormControl(0.0005, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      slippageRate: new FormControl(0.0002, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      riskPerTradePct: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] })
    });
  }

  ngOnInit(): void {
    this.generalInfoForm.controls.symbolCode.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((symbolCode) => {
      this.prefillProviderSymbol(symbolCode);
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

  get strategyConfigValid(): boolean {
    return this.strategyConfigSection?.isValid() ?? true;
  }

  onStrategyConfigChange(model: Record<string, unknown>): void {
    this.strategyConfigModel = { ...model };
  }

  save(): void {
    this.generalInfoForm.markAllAsTouched();
    this.riskRewardForm.markAllAsTouched();
    this.strategyConfigSection?.markAllAsTouched();

    if (this.generalInfoForm.invalid || this.riskRewardForm.invalid || !this.strategyConfigValid) {
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
        error: () => this.toastService.error(this.i18nService.t(TradeBotTextKey.SaveStrategyFailed))
      });
  }

  goBack(): void {
    void this.router.navigate([STRATEGY_MANAGEMENT_ROUTES.list]);
  }

  private loadPage(data: Data, params: ParamMap): void {
    const editId = params.get('id');
    const strategyCode = String(data['strategyCode'] ?? '');

    this.loading = true;
    this.loaded = false;

    const request$ = editId ? this.facade.loadEditContext(editId) : this.facade.loadCreateContext(strategyCode);
    this.loadingService
      .track(request$)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (context) => {
          this.editId = editId;
          this.applyContext(context, strategyCode);
          this.loaded = true;
        },
        error: () => {
          this.toastService.error(this.i18nService.t(TradeBotTextKey.LoadStrategyFormFailed));
          void this.router.navigate([STRATEGY_MANAGEMENT_ROUTES.list]);
        }
      });
  }

  private applyContext(context: StrategyFormPageContext, requestedStrategyCode: string): void {
    this.exchangeOptions = context.exchangeOptions;
    this.symbolOptions = context.symbolOptions;
    this.marketTypeOptions = context.marketTypeOptions;
    this.tradeSideModeOptions = context.tradeSideModeOptions;
    this.statusOptions = context.statusOptions;
    this.referenceSymbols = context.references.symbols;

    const strategyCode = context.binding?.strategyCode ?? requestedStrategyCode;
    this.currentStrategy = context.selectedStrategy ?? context.references.strategies.find((item) => item.code === strategyCode);
    this.strategyMeta = resolveStrategyUiMetadataByCode(strategyCode);
    this.strategyConfigDefinition = buildStrategySpecificConfigDefinition(strategyCode);
    this.strategyConfigContext.mode = this.editId ? 'edit' : 'create';
    this.strategyConfigContext.extra = { strategyCode, strategyMeta: this.strategyMeta };

    if (context.binding) {
      this.patchEditState(context.binding, this.currentStrategy);
      this.strategyConfigModel = mapApiConfigToStrategyConfig(context.binding.configJson, this.strategyConfigDefinition);
      return;
    }

    this.resetCreateState(strategyCode, this.currentStrategy, context.references.symbols);
  }

  private patchEditState(binding: TradeStrategyBindingResponse, strategy: StrategyResponse | undefined): void {
    this.formBuilders.patchFormsFromBinding(this.generalInfoForm, this.riskRewardForm, binding, strategy);
    this.generalInfoForm.controls.strategyCode.setValue(binding.strategyCode);
    this.generalInfoForm.controls.strategyName.setValue(strategy?.name ?? binding.strategyCode);
  }

  private resetCreateState(strategyCode: string, strategy: StrategyResponse | undefined, symbols: SymbolResponse[]): void {
    const defaultSymbol = symbols[0];
    this.generalInfoForm.reset(
      {
        name: '',
        strategyCode,
        strategyName: strategy?.name ?? strategyCode,
        exchangeCode: this.exchangeOptions[0]?.value ?? '',
        symbolCode: defaultSymbol?.code ?? '',
        marketType: defaultSymbol?.marketType ?? this.marketTypeOptions[0]?.value ?? '',
        tradeSideMode: 'BOTH',
        providerSymbol: defaultSymbol?.providerSymbol ?? defaultSymbol?.code ?? '',
        description: '',
        status: 'ACTIVE'
      },
      { emitEvent: false }
    );

    const configModel = { ...this.strategyConfigDefinition.initialValue };
    this.strategyConfigModel = configModel;
    this.riskRewardForm.reset(
      {
        entryMode: String(configModel['entryMode'] ?? StrategyEntryMode.NEXT_CANDLE_OPEN),
        slMode: String(configModel['slMode'] ?? StrategyStopLossMode.FIRST_CANDLE_MID_RANGE),
        tpRr: Number(configModel['tpRr'] ?? 2),
        maxTradesPerDay: Number(configModel['maxTradesPerDay'] ?? 1),
        strategyValidity: String(configModel['strategyValidity'] ?? StrategyValidityMode.SAME_NEW_YORK_DAY)
      },
      { emitEvent: false }
    );
  }

  private buildPayload(): TradeStrategyBindingCreateDto {
    const general = this.generalInfoForm.getRawValue();
    const riskReward = this.riskRewardForm.getRawValue();
    const strategyConfig = this.strategyConfigSection?.getModel() ?? this.strategyConfigModel;

    return {
      name: general.name.trim(),
      exchangeCode: general.exchangeCode,
      symbolCode: general.symbolCode,
      strategyCode: general.strategyCode,
      marketType: general.marketType,
      tradeSideMode: general.tradeSideMode,
      providerSymbol: general.providerSymbol.trim(),
      description: general.description.trim() || undefined,
      status: general.status,
      configJson: {
        ...mapStrategyConfigToApiPayload(strategyConfig),
        entry_mode: riskReward.entryMode,
        sl_mode: riskReward.slMode,
        tp_rr: riskReward.tpRr,
        max_trades_per_day: riskReward.maxTradesPerDay,
        strategy_validity: riskReward.strategyValidity,
        backtest_defaults: this.backtestDefaultsForm.getRawValue()
      }
    };
  }

  private prefillProviderSymbol(symbolCode: string): void {
    const symbol = this.referenceSymbols.find((item) => item.code === symbolCode);
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
