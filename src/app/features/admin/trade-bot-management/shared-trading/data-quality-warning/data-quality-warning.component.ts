import { Component, Input, computed, signal } from '@angular/core';
import { CandleBarResponse, CandleGapResponse } from '../../data-access/models/market-data.model';
import { TagSeverity } from '../../../../../shared/component/tag/tag';

interface DataQualityItem {
  label: string;
  value: string | number;
  severity: TagSeverity;
}

@Component({
  selector: 'app-data-quality-warning',
  standalone: false,
  templateUrl: './data-quality-warning.component.html',
  styleUrl: './data-quality-warning.component.css'
})
export class DataQualityWarningComponent {
  private readonly candlesSignal = signal<CandleBarResponse[]>([]);
  private readonly gapsSignal = signal<CandleGapResponse[]>([]);
  private readonly snapshotSignal = signal<Record<string, unknown> | null>(null);

  @Input() set candles(value: CandleBarResponse[] | null | undefined) {
    this.candlesSignal.set(value ?? []);
  }

  @Input() set gaps(value: CandleGapResponse[] | null | undefined) {
    this.gapsSignal.set(value ?? []);
  }

  @Input() set snapshot(value: Record<string, unknown> | null | undefined) {
    this.snapshotSignal.set(value ?? null);
  }

  readonly items = computed<DataQualityItem[]>(() => {
    const items: DataQualityItem[] = [];
    const candles = this.candlesSignal();
    const openGaps = this.gapsSignal().filter((gap) => !['REPAIRED', 'IGNORED'].includes(String(gap.status ?? '').toUpperCase()));
    const inferredGaps = this.inferMissingCandles(candles);
    const snapshotWarnings = this.snapshotWarningCount(this.snapshotSignal());

    if (!candles.length) {
      items.push({ label: 'tradeBot.dataQuality.noCandles', value: 0, severity: 'warn' });
    }
    if (openGaps.length) {
      items.push({ label: 'tradeBot.dataQuality.openGaps', value: openGaps.length, severity: 'danger' });
    }
    if (inferredGaps > 0) {
      items.push({ label: 'tradeBot.dataQuality.inferredGaps', value: inferredGaps, severity: 'warn' });
    }
    if (snapshotWarnings > 0) {
      items.push({ label: 'tradeBot.dataQuality.snapshotWarnings', value: snapshotWarnings, severity: 'warn' });
    }

    return items;
  });

  readonly hasWarnings = computed(() => this.items().length > 0);

  private inferMissingCandles(candles: CandleBarResponse[]): number {
    if (candles.length < 2) {
      return 0;
    }
    const timeframeMs = timeframeToMs(candles[0]?.timeframe);
    if (!timeframeMs) {
      return 0;
    }
    const sorted = [...candles].sort((a, b) => Date.parse(a.openTime) - Date.parse(b.openTime));
    let missing = 0;
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = Date.parse(sorted[index - 1].openTime);
      const current = Date.parse(sorted[index].openTime);
      const diff = current - previous;
      if (Number.isFinite(diff) && diff > timeframeMs) {
        missing += Math.max(0, Math.round(diff / timeframeMs) - 1);
      }
    }
    return missing;
  }

  private snapshotWarningCount(snapshot: Record<string, unknown> | null): number {
    if (!snapshot) {
      return 0;
    }
    const direct = Number(snapshot['warningsCount'] ?? snapshot['warningCount'] ?? snapshot['openGaps'] ?? snapshot['gapsDetected'] ?? 0);
    const warnings = snapshot['warnings'];
    if (Array.isArray(warnings)) {
      return warnings.length + (Number.isFinite(direct) ? direct : 0);
    }
    return Number.isFinite(direct) ? direct : 0;
  }
}

function timeframeToMs(timeframe: string | undefined): number | null {
  if (!timeframe) {
    return null;
  }
  const match = timeframe.trim().match(/^(\d+)([mMhHdDwW])$/);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000
  };
  return value * multipliers[unit];
}
