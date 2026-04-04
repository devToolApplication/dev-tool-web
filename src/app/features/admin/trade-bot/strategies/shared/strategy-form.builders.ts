import { Injectable } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TradeBotStatus, TradeSideMode, TradeStrategyBindingResponse } from '../../../../../core/models/trade-bot/trade-strategy-binding.model';
import { StrategyResponse } from '../../../../../core/models/trade-bot/reference-data.model';
import { StrategyFormValidators } from './strategy-form.validators';
import { StrategyEntryMode, StrategyStopLossMode, StrategyValidityMode } from './strategy-ui.enums';

export interface StrategyGeneralInfoFormModel {
  name: FormControl<string>;
  strategyId: FormControl<string>;
  strategyServiceName: FormControl<string>;
  strategyName: FormControl<string>;
  ruleId: FormControl<string>;
  exchangeId: FormControl<string>;
  symbolId: FormControl<string>;
  marketType: FormControl<string>;
  tradeSideMode: FormControl<TradeSideMode>;
  providerSymbol: FormControl<string>;
  description: FormControl<string>;
  status: FormControl<TradeBotStatus>;
}

export interface StrategyRiskRewardFormModel {
  entryMode: FormControl<string>;
  slMode: FormControl<string>;
  tpRr: FormControl<number>;
  maxTradesPerDay: FormControl<number>;
  strategyValidity: FormControl<string>;
}

export type StrategyGeneralInfoFormGroup = FormGroup<StrategyGeneralInfoFormModel>;
export type StrategyRiskRewardFormGroup = FormGroup<StrategyRiskRewardFormModel>;

@Injectable({ providedIn: 'root' })
export class StrategyFormBuilders {
  constructor(private readonly fb: FormBuilder) {}

  createGeneralInfoForm(): StrategyGeneralInfoFormGroup {
    return this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(120), StrategyFormValidators.nonBlank()]],
      strategyId: [''],
      strategyServiceName: [{ value: '', disabled: true }, [Validators.required]],
      strategyName: [{ value: '', disabled: true }, [Validators.required]],
      ruleId: ['', Validators.required],
      exchangeId: ['', Validators.required],
      symbolId: ['', Validators.required],
      marketType: ['', Validators.required],
      tradeSideMode: ['BOTH' as TradeSideMode, Validators.required],
      providerSymbol: ['', [Validators.required, StrategyFormValidators.nonBlank()]],
      description: [''],
      status: ['ACTIVE' as TradeBotStatus, Validators.required]
    });
  }

  createRiskRewardForm(): StrategyRiskRewardFormGroup {
    return this.fb.nonNullable.group({
      entryMode: [String(StrategyEntryMode.NEXT_CANDLE_OPEN)],
      slMode: [String(StrategyStopLossMode.FIRST_CANDLE_MID_RANGE)],
      tpRr: [2, [Validators.required, Validators.min(0.1), StrategyFormValidators.positiveNumber(0)]],
      maxTradesPerDay: [1, [Validators.required, Validators.min(1), StrategyFormValidators.positiveNumber(0)]],
      strategyValidity: [String(StrategyValidityMode.SAME_NEW_YORK_DAY)]
    });
  }

  patchFormsFromBinding(
    generalForm: StrategyGeneralInfoFormGroup,
    riskRewardForm: StrategyRiskRewardFormGroup,
    binding: TradeStrategyBindingResponse,
    strategy: StrategyResponse | undefined
  ): void {
    generalForm.patchValue({
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
    });

    riskRewardForm.patchValue({
      entryMode: String(binding.configJson?.['entry_mode'] ?? StrategyEntryMode.NEXT_CANDLE_OPEN),
      slMode: String(binding.configJson?.['sl_mode'] ?? StrategyStopLossMode.FIRST_CANDLE_MID_RANGE),
      tpRr: Number(binding.configJson?.['tp_rr'] ?? 2),
      maxTradesPerDay: Number(binding.configJson?.['max_trades_per_day'] ?? 1),
      strategyValidity: String(binding.configJson?.['strategy_validity'] ?? StrategyValidityMode.SAME_NEW_YORK_DAY)
    });
  }
}
