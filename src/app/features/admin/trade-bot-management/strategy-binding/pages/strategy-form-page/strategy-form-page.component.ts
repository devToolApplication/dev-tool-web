import { Component, DestroyRef, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Data, ParamMap, Router } from '@angular/router';
import { combineLatest, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StrategyResponse, SymbolResponse } from '../../../../../../core/models/trade-bot/reference-data.model';
import {
  TradeStrategyBindingCreateDto,
  TradeStrategyBindingResponse,
  TradeStrategySelectedRule
} from '../../../../../../core/models/trade-bot/trade-strategy-binding.model';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { STRATEGY_MANAGEMENT_ROUTES, STRATEGY_FAMILY_LABELS } from '../../strategy-management.constants';
import { StrategyFormBuilders, StrategyGeneralInfoFormGroup } from '../../shared/strategy-form.builders';
import {
  StrategyConfigDefinition,
  StrategyRuleSlotDefinition,
  mapApiConfigToStrategyConfig,
  mapStrategyConfigToApiPayload
} from '../../shared/strategy-config-form.factory';
import { StrategyFormFacade, StrategyFormPageContext, StrategySelectOption } from '../../shared/strategy-form.facade';
import { TradeBotTextKey } from '../../shared/strategy-ui.enums';
import { resolveStrategyUiMetadataByServiceName } from '../../shared/strategy-ui.registry';
import { StrategyRuleResponse } from '../../../../../../core/models/trade-bot/strategy-rule.model';
import { STRATEGY_RULE_ROUTES } from '../../../rule-config/strategy-rule.constants';
import { StrategySpecificConfigSectionComponent } from '../../shared/components/strategy-specific-config-section.component';

type RuleSlotFormGroup = FormGroup<Record<string, FormControl<string>>>;

@Component({
  selector: 'app-strategy-form-page',
  standalone: false,
  templateUrl: './strategy-form-page.component.html',
  styleUrl: './strategy-form-page.component.css'
})
export class StrategyFormPageComponent implements OnInit {
  private static readonly SAME_GROUP_RULE_SELECTION_MODE = 'SAME_GROUP';

  readonly generalInfoForm: StrategyGeneralInfoFormGroup;
  readonly TEXT = TradeBotTextKey;
  @ViewChild('strategyConfigSection')
  strategyConfigSection?: StrategySpecificConfigSectionComponent;

  editId: string | null = null;
  readonly loaded = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);

  strategyMeta = resolveStrategyUiMetadataByServiceName('FVG_TOUCH_RETEST');
  currentStrategy?: StrategyResponse;
  strategyDefinition: StrategyConfigDefinition = {
    code: '',
    label: '',
    description: '',
    executor: '',
    ruleGroupSelectionMode: 'ANY',
    formConfig: { fields: [] },
    initialValue: {},
    ruleSlots: []
  };
  referenceSymbols: SymbolResponse[] = [];
  availableRules: StrategyRuleResponse[] = [];
  strategyConfigInitialValue: Record<string, unknown> = {};
  strategyConfigModel: Record<string, unknown> = {};

  exchangeOptions: StrategySelectOption[] = [];
  symbolOptions: StrategySelectOption[] = [];
  marketTypeOptions: StrategySelectOption[] = [];
  tradeSideModeOptions: StrategySelectOption[] = [];
  statusOptions: StrategySelectOption[] = [];

  ruleSlotsForm: RuleSlotFormGroup = new FormGroup({});

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly formBuilders: StrategyFormBuilders,
    private readonly facade: StrategyFormFacade,
    private readonly i18nService: I18nService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService,
    private readonly destroyRef: DestroyRef
  ) {
    this.generalInfoForm = this.formBuilders.createGeneralInfoForm();
  }

  ngOnInit(): void {
    this.generalInfoForm.controls.symbolId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((symbolId) => {
      this.prefillProviderSymbol(symbolId);
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
    return this.ruleSlotsForm.valid;
  }

  get selectedRuleDetails(): Array<{ slot: StrategyRuleSlotDefinition; rule?: StrategyRuleResponse; configJson?: Record<string, unknown> }> {
    return this.strategyDefinition.ruleSlots.map((slot) => ({
      slot,
      rule: this.findRuleById(this.ruleSlotsForm.controls[slot.slotCode]?.value ?? ''),
      configJson: this.findRuleById(this.ruleSlotsForm.controls[slot.slotCode]?.value ?? '')?.configJson
    }));
  }

  save(): void {
    this.generalInfoForm.markAllAsTouched();
    this.ruleSlotsForm.markAllAsTouched();
    this.strategyConfigSection?.markAllAsTouched();

    if (this.generalInfoForm.invalid || this.ruleSlotsForm.invalid || this.strategyConfigSection?.isValid() === false) {
      this.toastService.info(this.i18nService.t(TradeBotTextKey.ReviewStrategyBeforeSave));
      return;
    }

    const payload = this.buildPayload();
    this.saving.set(true);
    this.loadingService
      .track(this.facade.save(this.editId, payload))
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
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

  goRulePreview(ruleId: string | undefined): void {
    if (!ruleId) {
      return;
    }
    void this.router.navigate([STRATEGY_RULE_ROUTES.test(ruleId)]);
  }

  getRuleOptions(slot: StrategyRuleSlotDefinition): StrategySelectOption[] {
    return this.getRuleOptionsForSlot(slot);
  }

  onRuleSelectionChange(slotCode: string): void {
    this.reconcileRuleGroupSelections(slotCode);
  }

  onStrategyConfigChange(value: Record<string, unknown>): void {
    this.strategyConfigModel = value ?? {};
  }

  private getRuleOptionsForSlot(slot: StrategyRuleSlotDefinition, pinnedRuleGroupCode?: string | null): StrategySelectOption[] {
    const acceptedRuleCodes = new Set((slot.acceptedRuleCodes ?? []).map((item) => item.toUpperCase()));
    const acceptedRuleGroupCodes = new Set((slot.acceptedRuleGroupCodes ?? []).map((item) => item.toUpperCase()));
    const effectiveRuleGroupCode = pinnedRuleGroupCode ?? this.getPinnedRuleGroupCode(slot.slotCode);

    return this.availableRules
      .filter((item) => item.status === 'ACTIVE')
      .filter((item) => acceptedRuleCodes.size === 0 || acceptedRuleCodes.has(String(item.code ?? '').trim().toUpperCase()))
      .filter(
        (item) =>
          acceptedRuleGroupCodes.size === 0 ||
          acceptedRuleGroupCodes.has(this.normalizeRuleGroupCode(item.ruleGroupCode))
      )
      .filter((item) => !effectiveRuleGroupCode || this.normalizeRuleGroupCode(item.ruleGroupCode) === effectiveRuleGroupCode)
      .map((item) => ({ label: `${item.code} - ${item.name}`, value: item.id }));
  }

  private loadPage(data: Data, params: ParamMap): void {
    const editId = params.get('id');
    const strategyServiceName = String(data['strategyServiceName'] ?? '');

    this.loading.set(true);
    this.loaded.set(false);

    const request$ = editId ? this.facade.loadEditContext(editId) : this.facade.loadCreateContext(strategyServiceName);
    this.loadingService
      .track(request$)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (context) => {
          this.editId = editId;
          this.applyContext(context, strategyServiceName);
          this.loaded.set(true);
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
    this.strategyDefinition = context.selectedDefinition;
    this.availableRules = context.references.rules ?? [];
    this.strategyConfigInitialValue = { ...this.strategyDefinition.initialValue };
    this.strategyConfigModel = { ...this.strategyConfigInitialValue };

    this.buildRuleSlotsForm(this.strategyDefinition.ruleSlots, context.binding?.selectedRules ?? []);

    if (context.binding) {
      this.patchEditState(context.binding, this.currentStrategy);
      return;
    }

    this.resetCreateState(strategyServiceName, this.currentStrategy, context.references.symbols);
  }

  private buildRuleSlotsForm(slots: StrategyRuleSlotDefinition[], selectedRules: TradeStrategySelectedRule[]): void {
    const controls: Record<string, FormControl<string>> = {};

    slots.forEach((slot) => {
      const matchedSelection = selectedRules.find((item) => item.slotCode?.toUpperCase() === slot.slotCode.toUpperCase());
      const defaultOption = this.getRuleOptionsForSlot(slot)[0]?.value ?? '';
      controls[slot.slotCode] = new FormControl(matchedSelection?.ruleId ?? (slot.required ? defaultOption : ''), {
        nonNullable: true,
        validators: slot.required ? [Validators.required] : []
      });
    });

    this.ruleSlotsForm = new FormGroup(controls);
    this.reconcileRuleGroupSelections();
  }

  private patchEditState(binding: TradeStrategyBindingResponse, strategy: StrategyResponse | undefined): void {
    this.generalInfoForm.reset(
      {
        name: binding.name ?? '',
        strategyId: binding.strategyId ?? '',
        strategyServiceName: binding.strategyServiceName ?? '',
        strategyName: strategy?.name ?? binding.strategyName ?? binding.strategyServiceName ?? '',
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
    this.strategyConfigInitialValue = mapApiConfigToStrategyConfig(binding.configJson ?? {}, this.strategyDefinition);
    this.strategyConfigModel = { ...this.strategyConfigInitialValue };
  }

  private resetCreateState(strategyServiceName: string, strategy: StrategyResponse | undefined, symbols: SymbolResponse[]): void {
    const defaultSymbol = symbols[0];
    this.generalInfoForm.reset(
      {
        name: '',
        strategyId: strategy?.id ?? '',
        strategyServiceName,
        strategyName: strategy?.name ?? this.strategyDefinition.label ?? strategyServiceName,
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
    this.strategyConfigInitialValue = { ...this.strategyDefinition.initialValue };
    this.strategyConfigModel = { ...this.strategyConfigInitialValue };
  }

  private buildPayload(): TradeStrategyBindingCreateDto {
    const general = this.generalInfoForm.getRawValue();
    const strategyConfig = this.strategyConfigSection?.getModel<Record<string, unknown>>() ?? this.strategyConfigModel;

    return {
      name: general.name.trim(),
      exchangeId: general.exchangeId,
      symbolId: general.symbolId,
      strategyId: general.strategyId,
      marketType: general.marketType,
      tradeSideMode: general.tradeSideMode,
      providerSymbol: general.providerSymbol.trim(),
      description: general.description.trim() || undefined,
      status: general.status,
      configJson: mapStrategyConfigToApiPayload(strategyConfig),
      selectedRules: this.buildSelectedRulePayload()
    };
  }

  private buildSelectedRulePayload(): TradeStrategySelectedRule[] {
    return this.strategyDefinition.ruleSlots
      .map((slot) => {
        const ruleId = this.ruleSlotsForm.controls[slot.slotCode]?.value ?? '';
        if (!ruleId) {
          return null;
        }
        const rule = this.findRuleById(ruleId);
        return {
          slotCode: slot.slotCode,
          slotLabel: slot.label,
          ruleId,
          ruleCode: rule?.code ?? ruleId,
          ruleName: rule?.name,
          ruleGroupCode: rule?.ruleGroupCode,
          ruleGroupLabel: rule?.ruleGroupLabel,
          configJson: rule?.configJson ? { ...rule.configJson } : undefined
        } as TradeStrategySelectedRule;
      })
      .filter((item): item is TradeStrategySelectedRule => item !== null);
  }

  private findRuleById(ruleId: string): StrategyRuleResponse | undefined {
    if (!ruleId) {
      return undefined;
    }
    return this.availableRules.find((item) => item.id === ruleId);
  }

  private reconcileRuleGroupSelections(changedSlotCode?: string): void {
    if (this.strategyDefinition.ruleGroupSelectionMode !== StrategyFormPageComponent.SAME_GROUP_RULE_SELECTION_MODE) {
      return;
    }

    const pinnedRuleGroupCode =
      (changedSlotCode ? this.normalizeRuleGroupCode(this.findRuleById(this.ruleSlotsForm.controls[changedSlotCode]?.value ?? '')?.ruleGroupCode) : '') ||
      this.getPinnedRuleGroupCode();
    if (!pinnedRuleGroupCode) {
      return;
    }

    this.strategyDefinition.ruleSlots.forEach((slot) => {
      if (slot.slotCode === changedSlotCode) {
        return;
      }

      const control = this.ruleSlotsForm.controls[slot.slotCode];
      if (!control) {
        return;
      }

      const currentRule = this.findRuleById(control.value);
      if (this.normalizeRuleGroupCode(currentRule?.ruleGroupCode) === pinnedRuleGroupCode) {
        return;
      }

      const nextOption = this.getRuleOptionsForSlot(slot, pinnedRuleGroupCode)[0];
      control.setValue(nextOption?.value ?? '', { emitEvent: false });
    });
  }

  private getPinnedRuleGroupCode(excludedSlotCode?: string): string | null {
    if (this.strategyDefinition.ruleGroupSelectionMode !== StrategyFormPageComponent.SAME_GROUP_RULE_SELECTION_MODE) {
      return null;
    }

    const selectedRuleGroups = this.strategyDefinition.ruleSlots
      .filter((slot) => slot.slotCode !== excludedSlotCode)
      .map((slot) => this.findRuleById(this.ruleSlotsForm.controls[slot.slotCode]?.value ?? ''))
      .map((rule) => this.normalizeRuleGroupCode(rule?.ruleGroupCode))
      .filter((groupCode) => !!groupCode);
    const distinctGroups = [...new Set(selectedRuleGroups)];
    return distinctGroups.length === 1 ? distinctGroups[0] : null;
  }

  private normalizeRuleGroupCode(value: string | null | undefined): string {
    return String(value ?? '')
      .trim()
      .toUpperCase();
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
