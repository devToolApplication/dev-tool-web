import { Component, Input } from '@angular/core';
import { ReplayRuleExplanation, ReplayStep, ReplayStepEvent, ReplayTradeTimelineItem } from '../../../../../../../core/models/trade-bot/strategy-replay.model';
import { TradeBotTextKey } from '../../../shared/strategy-ui.enums';

@Component({
  selector: 'app-replay-step-explanation-panel',
  standalone: false,
  templateUrl: './replay-step-explanation-panel.component.html',
  styleUrl: './replay-step-explanation-panel.component.css'
})
export class ReplayStepExplanationPanelComponent {
  @Input() step: ReplayStep | null = null;
  @Input() rules: ReplayRuleExplanation[] = [];
  @Input() events: ReplayStepEvent[] = [];
  @Input() activeTrade: ReplayTradeTimelineItem | null = null;
  readonly TEXT = TradeBotTextKey;

  severity(status: ReplayRuleExplanation['status']): 'success' | 'danger' | 'secondary' {
    if (status === 'PASS') {
      return 'success';
    }
    if (status === 'FAIL') {
      return 'danger';
    }
    return 'secondary';
  }
}
