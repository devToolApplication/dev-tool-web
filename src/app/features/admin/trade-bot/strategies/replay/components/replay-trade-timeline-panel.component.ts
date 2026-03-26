import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReplayTradeTimelineItem } from '../../../../../../core/models/trade-bot/strategy-replay.model';
import { TradeBotTextKey } from '../../shared/strategy-ui.enums';

@Component({
  selector: 'app-replay-trade-timeline-panel',
  standalone: false,
  templateUrl: './replay-trade-timeline-panel.component.html',
  styleUrl: './replay-trade-timeline-panel.component.css'
})
export class ReplayTradeTimelinePanelComponent {
  @Input() trades: ReplayTradeTimelineItem[] = [];
  @Input() highlightedTradeId: string | null = null;
  @Output() tradeSelect = new EventEmitter<ReplayTradeTimelineItem>();

  expandedTradeId: string | null = null;
  readonly TEXT = TradeBotTextKey;

  toggleExpanded(tradeId: string, event: Event): void {
    event.stopPropagation();
    this.expandedTradeId = this.expandedTradeId === tradeId ? null : tradeId;
  }
}
