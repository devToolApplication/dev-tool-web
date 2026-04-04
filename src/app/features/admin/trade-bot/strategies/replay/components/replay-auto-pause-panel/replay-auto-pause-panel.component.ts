import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StrategyReplayEventType } from '../../../../../../../core/models/trade-bot/strategy-replay.model';
import { REPLAY_EVENT_TYPE_OPTIONS, TradeBotTextKey } from '../../../shared/strategy-ui.enums';

@Component({
  selector: 'app-replay-auto-pause-panel',
  standalone: false,
  templateUrl: './replay-auto-pause-panel.component.html',
  styleUrl: './replay-auto-pause-panel.component.css'
})
export class ReplayAutoPausePanelComponent {
  @Input() enabled = true;
  @Input() selectedTypes: StrategyReplayEventType[] = [];
  @Output() enabledChange = new EventEmitter<boolean>();
  @Output() toggleType = new EventEmitter<StrategyReplayEventType>();
  readonly TEXT = TradeBotTextKey;

  readonly autoPauseOptions: Array<{ label: string; value: StrategyReplayEventType }> = REPLAY_EVENT_TYPE_OPTIONS.filter((item) =>
    ['setup-formed', 'order-placed', 'tp-hit', 'sl-hit', 'trade-closed'].includes(String(item.value))
  ) as Array<{ label: string; value: StrategyReplayEventType }>;
}
