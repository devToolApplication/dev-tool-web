import { Component, Input } from '@angular/core';
import { StrategyGeneralInfoFormGroup } from '../strategy-form.builders';
import { TradeBotTextKey } from '../strategy-ui.enums';

@Component({
  selector: 'app-strategy-general-info-section',
  standalone: false,
  templateUrl: './strategy-general-info-section.component.html',
  styleUrl: './strategy-general-info-section.component.css'
})
export class StrategyGeneralInfoSectionComponent {
  @Input({ required: true }) form!: StrategyGeneralInfoFormGroup;
  @Input() exchangeOptions: Array<{ label: string; value: string }> = [];
  @Input() symbolOptions: Array<{ label: string; value: string }> = [];
  @Input() marketTypeOptions: Array<{ label: string; value: string }> = [];
  @Input() tradeSideModeOptions: Array<{ label: string; value: string }> = [];
  @Input() statusOptions: Array<{ label: string; value: string }> = [];

  readonly TEXT = TradeBotTextKey;
}
