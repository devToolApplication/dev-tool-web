import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StrategyTypePickerItem } from '../../../../../../core/models/trade-bot/strategy-ui.model';
import { STRATEGY_FAMILY_LABELS } from '../../strategy-management.constants';
import { TradeBotTextKey } from '../strategy-ui.enums';

@Component({
  selector: 'app-strategy-type-picker-popup',
  standalone: false,
  templateUrl: './strategy-type-picker-popup.component.html',
  styleUrl: './strategy-type-picker-popup.component.css'
})
export class StrategyTypePickerPopupComponent {
  @Input() visible = false;
  @Input() loading = false;
  @Input() keyword = '';
  @Input() items: Array<StrategyTypePickerItem & { shortDescription?: string }> = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() keywordChange = new EventEmitter<string>();
  @Output() select = new EventEmitter<StrategyTypePickerItem>();
  @Output() cancel = new EventEmitter<void>();

  protected readonly TEXT = TradeBotTextKey;
  protected readonly STRATEGY_FAMILY_LABELS = STRATEGY_FAMILY_LABELS;
}
