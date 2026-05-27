import { Component, computed, EventEmitter, Input, Output } from '@angular/core';
import { AppTabItem } from '../../../../../../../shared/component/tabs/tabs.component';
import { ChartCandle } from '../../../../share/candle-chart/candle-chart';
import { RealtimeProgressEvent } from '../../../../../../../core/models/realtime/realtime.model';

@Component({
  selector: 'app-replay-debug-panel',
  standalone: false,
  templateUrl: './replay-debug-panel.component.html'
})
export class ReplayDebugPanelComponent {
  @Input() evaluation: Record<string, unknown> | null = null;
  @Input() strategySignal: Record<string, unknown> | null = null;
  @Input() ruleTrace: Record<string, unknown> | null = null;
  @Input() selectedCandle: ChartCandle | null = null;
  @Input() replayEvent: RealtimeProgressEvent | null = null;
  @Input() replayOverlays: unknown = {};

  readonly activeTab = 'signal';
  readonly tabs: AppTabItem[] = [
    { label: 'tradeBot.replay.signal', value: 'signal' },
    { label: 'tradeBot.replay.ruleTrace', value: 'ruleTrace' },
    { label: 'tradeBot.replay.candle', value: 'candle' },
    { label: 'tradeBot.replay.raw', value: 'raw' }
  ];

  currentTab = 'signal';

  readonly evaluationTrace = computed<Record<string, unknown>>(() => {
    const trace = this.ruleTrace;
    if (trace) {
      return trace;
    }
    const evaluation = this.evaluation;
    return ((evaluation?.['ruleTrace'] ?? evaluation?.['trace'] ?? evaluation) as Record<string, unknown>) ?? {};
  });

  readonly signalSummary = computed(() => this.resolveSignalRecord());

  readonly signalSide = computed(() => String(this.signalSummary()?.['side'] ?? this.signalSummary()?.['signal'] ?? '-').toUpperCase());

  readonly signalSummaryFacts = computed(() => {
    const signal = this.signalSummary();
    return [
      { label: 'tradeBot.field.entryPrice', value: this.formatDisplayValue(this.pickValue(signal, ['entryPrice', 'entry'])) },
      { label: 'tradeBot.replay.stopLoss', value: this.formatDisplayValue(this.pickValue(signal, ['stopLoss', 'sl'])) },
      { label: 'tradeBot.replay.takeProfit', value: this.formatDisplayValue(this.pickValue(signal, ['takeProfit', 'tp'])) },
      { label: 'tradeBot.replay.riskReward', value: this.formatDisplayValue(this.pickValue(signal, ['riskReward', 'rr'])) },
      { label: 'tradeBot.replay.confidence', value: this.formatDisplayValue(this.pickValue(signal, ['confidence', 'score'])) },
      { label: 'tradeBot.replay.signalTime', value: this.formatDisplayValue(this.pickValue(signal, ['signalTime', 'time', 'openTime'])) }
    ];
  });

  readonly selectedCandleFacts = computed(() => {
    const candle = this.selectedCandle;
    return [
      { label: 'tradeBot.field.openTime', value: candle?.openTime ?? '-' },
      { label: 'tradeBot.field.open', value: candle?.open ?? '-' },
      { label: 'tradeBot.field.high', value: candle?.high ?? '-' },
      { label: 'tradeBot.field.low', value: candle?.low ?? '-' },
      { label: 'tradeBot.field.close', value: candle?.close ?? '-' },
      { label: 'tradeBot.field.volume', value: candle?.volume ?? '-' }
    ];
  });

  onTabChange(tab: string): void {
    this.currentTab = tab;
  }

  replayEventJson(): RealtimeProgressEvent | null {
    return this.replayEvent;
  }

  evaluationJson(): unknown {
    return this.evaluation ?? {};
  }

  replayJson(): unknown {
    return this.replayOverlays ?? {};
  }

  private resolveSignalRecord(): Record<string, unknown> | null {
    const signal = this.strategySignal;
    if (signal) {
      return signal;
    }
    const evaluation = this.evaluation;
    const nested = evaluation?.['strategy'];
    if (nested && typeof nested === 'object') {
      return nested as Record<string, unknown>;
    }
    if (evaluation && ('entryPrice' in evaluation || 'stopLoss' in evaluation || 'takeProfit' in evaluation)) {
      return evaluation;
    }
    return null;
  }

  private pickValue(record: Record<string, unknown> | null | undefined, keys: string[]): unknown {
    if (!record) {
      return null;
    }
    for (const key of keys) {
      const value = record[key];
      if (value != null && value !== '') {
        return value;
      }
    }
    return null;
  }

  private formatDisplayValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? String(value) : '-';
    }
    return String(value);
  }
}
