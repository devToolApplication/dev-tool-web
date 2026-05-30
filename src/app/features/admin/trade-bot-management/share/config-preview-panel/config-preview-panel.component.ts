import { Component, computed, input, output, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ChartCandle, ChartIndicator, ChartOverlay } from '../../../../../shared/ui/candle-chart';
import { TradingSystemService } from '../../data-access/api/trading-system.service';

export type PreviewType = 'indicator' | 'rule';

interface RuleResult {
  index: number;
  satisfied: boolean;
}

@Component({
  selector: 'app-config-preview-panel',
  standalone: false,
  templateUrl: './config-preview-panel.component.html',
  styleUrl: './config-preview-panel.component.css'
})
export class ConfigPreviewPanelComponent {
  readonly previewType = input.required<PreviewType>();
  readonly configPayload = input.required<Record<string, unknown>>();
  readonly closed = output<void>();

  readonly symbol = signal('BTCUSDT');
  readonly timeframe = signal('1h');
  readonly fromTimeDate = signal<Date | null>(null);
  readonly toTimeDate = signal<Date | null>(null);

  readonly timeframeOptions = [
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1d', value: '1d' }
  ];

  readonly loading = signal(false);
  readonly hasResult = signal(false);
  readonly candles = signal<ChartCandle[]>([]);
  readonly indicators = signal<ChartIndicator[]>([]);
  readonly overlays = signal<ChartOverlay[]>([]);
  readonly ruleResults = signal<RuleResult[]>([]);
  readonly satisfiedCount = computed(() => this.ruleResults().filter(r => r.satisfied).length);

  constructor(private readonly tradingSystemService: TradingSystemService) {}

  close(): void {
    this.closed.emit();
  }

  onSymbolChange(value: unknown): void {
    this.symbol.set(String(value ?? ''));
  }

  onTimeframeChange(value: unknown): void {
    this.timeframe.set(String(value ?? '1h'));
  }

  onFromTimeChange(value: unknown): void {
    this.fromTimeDate.set(value instanceof Date ? value : null);
  }

  onToTimeChange(value: unknown): void {
    this.toTimeDate.set(value instanceof Date ? value : null);
  }

  runPreview(): void {
    const fromTime = this.fromTimeDate();
    const toTime = this.toTimeDate();

    const payload = {
      ...this.configPayload(),
      symbol: this.symbol(),
      timeframe: this.timeframe(),
      fromTime: fromTime ? fromTime.toISOString() : undefined,
      toTime: toTime ? toTime.toISOString() : undefined
    };

    this.loading.set(true);
    this.hasResult.set(false);

    const request$ = this.previewType() === 'indicator'
      ? this.tradingSystemService.previewIndicator(payload)
      : this.tradingSystemService.previewRule(payload);

    request$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (result: any) => {
        this.candles.set(result?.candles ?? []);
        this.indicators.set(result?.indicators ?? []);
        this.overlays.set(result?.overlays ?? []);
        this.ruleResults.set(result?.ruleResults ?? []);
        this.hasResult.set(true);
      },
      error: () => {
        this.hasResult.set(false);
      }
    });
  }
}
