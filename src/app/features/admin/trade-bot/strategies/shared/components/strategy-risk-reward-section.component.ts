import { Component, Input } from '@angular/core';
import { StrategyRiskRewardFormGroup } from '../strategy-form.builders';
import { STRATEGY_ENTRY_MODE_OPTIONS, STRATEGY_SL_MODE_OPTIONS, STRATEGY_VALIDITY_OPTIONS, TradeBotTextKey } from '../strategy-ui.enums';

@Component({
  selector: 'app-strategy-risk-reward-section',
  standalone: false,
  templateUrl: './strategy-risk-reward-section.component.html',
  styleUrl: './strategy-risk-reward-section.component.css'
})
export class StrategyRiskRewardSectionComponent {
  @Input({ required: true }) form!: StrategyRiskRewardFormGroup;

  readonly TEXT = TradeBotTextKey;
  readonly entryModeOptions = STRATEGY_ENTRY_MODE_OPTIONS;
  readonly slModeOptions = STRATEGY_SL_MODE_OPTIONS;
  readonly validityOptions = STRATEGY_VALIDITY_OPTIONS;
}
