import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StrategyReplayEventType, ReplayStepEvent } from '../../../../../../../core/models/trade-bot/strategy-replay.model';
import { REPLAY_EVENT_TYPE_OPTIONS, TradeBotTextKey } from '../../../shared/strategy-ui.enums';

@Component({
  selector: 'app-replay-event-log-panel',
  standalone: false,
  templateUrl: './replay-event-log-panel.component.html',
  styleUrl: './replay-event-log-panel.component.css'
})
export class ReplayEventLogPanelComponent {
  @Input() events: ReplayStepEvent[] = [];
  @Input() selectedEventId: string | null = null;
  @Input() selectedFilters: StrategyReplayEventType[] = [];
  @Output() eventSelect = new EventEmitter<ReplayStepEvent>();
  @Output() filterChange = new EventEmitter<StrategyReplayEventType[]>();

  readonly TEXT = TradeBotTextKey;
  readonly eventTypeOptions: Array<{ label: string; value: StrategyReplayEventType }> = REPLAY_EVENT_TYPE_OPTIONS as Array<{
    label: string;
    value: StrategyReplayEventType;
  }>;
}
