import { Component, computed, input, output, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ChartCandle, ChartIndicator, ChartOverlay } from '../../../../../shared/ui/candle-chart';
import { CandleChartOverlayMapper } from '../../../../../shared/ui/candle-chart/candle-chart-overlay.mapper';
import { TradingSystemService } from '../../data-access/api/trading-system.service';

export type PreviewType = 'indicator' | 'rule';

interface RuleResult {
  index: number;
  satisfied: boolean;
}

interface PreviewPoint {
  time?: unknown;
  value?: unknown;
}

function defaultDateRange(): Date[] {
  const to = new Date();
  to.setMinutes(0, 0, 0);
  const from = new Date(to);
  from.setMonth(from.getMonth() - 1);
  return [from, to];
}

function toPreviewIso(value: Date | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = new Date(value);
  normalized.setSeconds(0, 0);
  return normalized.toISOString();
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
  readonly dateRange = signal<Date[]>(defaultDateRange());

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

  constructor(
    private readonly tradingSystemService: TradingSystemService,
    private readonly overlayMapper: CandleChartOverlayMapper,
  ) {}

  close(): void {
    this.closed.emit();
  }

  onSymbolChange(value: unknown): void {
    this.symbol.set(String(value ?? ''));
  }

  onTimeframeChange(value: unknown): void {
    this.timeframe.set(String(value ?? '1h'));
  }

  onDateRangeChange(value: Date | Date[] | null): void {
    if (Array.isArray(value)) {
      this.dateRange.set(value);
    }
  }

  runPreview(): void {
    const range = this.dateRange();
    const fromTime = range[0];
    const toTime = range[1];

    const payload = {
      ...this.configPayload(),
      symbol: this.symbol(),
      timeframe: this.timeframe(),
      fromTime: toPreviewIso(fromTime),
      toTime: toPreviewIso(toTime)
    };

    this.loading.set(true);
    this.hasResult.set(false);

    const request$ = this.previewType() === 'indicator'
      ? this.tradingSystemService.previewIndicator(payload)
      : this.tradingSystemService.previewRule(payload);

    request$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (result: Record<string, unknown>) => {
        const candles = this.toChartCandles(result['candles']);
        this.candles.set(candles);
        this.indicators.set(this.toChartIndicators(result, candles));
        this.overlays.set(this.toChartOverlays(result['overlays'], candles));
        this.ruleResults.set(Array.isArray(result['ruleResults']) ? (result['ruleResults'] as RuleResult[]) : []);
        this.hasResult.set(true);
      },
      error: () => {
        this.hasResult.set(false);
      }
    });
  }

  private toChartCandles(value: unknown): ChartCandle[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map((item, index) => {
      const candle = this.asRecord(item);
      return {
        index,
        time: String(candle['openTime'] ?? candle['time'] ?? ''),
        openTime: String(candle['openTime'] ?? candle['time'] ?? ''),
        closeTime: String(candle['closeTime'] ?? candle['time'] ?? ''),
        open: this.toNumber(candle['open']),
        high: this.toNumber(candle['high']),
        low: this.toNumber(candle['low']),
        close: this.toNumber(candle['close']),
        // volume from backend may be negative due to scale sharing; use abs to prevent inverted histogram
        volume: Math.abs(this.toNumber(candle['volume'])),
        closed: Boolean(candle['closed'])
      };
    }).filter((candle) => candle.time);
  }

  private toChartIndicators(result: Record<string, unknown>, candles: ChartCandle[]): ChartIndicator[] {
    const directIndicators = result['indicators'];
    if (Array.isArray(directIndicators)) {
      return directIndicators as ChartIndicator[];
    }

    const indicatorValues = this.asRecord(result['indicatorValues']);
    return Object.entries(indicatorValues)
      .map(([name, value], index) => this.buildIndicator(name, value, index, candles))
      .filter((indicator): indicator is ChartIndicator => indicator !== null);
  }

  private buildIndicator(name: string, value: unknown, index: number, candles: ChartCandle[]): ChartIndicator | null {
    if (!Array.isArray(value)) {
      return null;
    }

    // use resolveIndicatorMetaPublic so ATR/RSI/MACD land on the correct pane instead of hardcoded overlay
    const meta = this.overlayMapper.resolveIndicatorMetaPublic(name);

    // align indicator points by visible-range index into the candles array
    const values = new Array<number | null>(candles.length).fill(null);
    value.forEach((point) => {
      const p = this.asRecord(point) as PreviewPoint;
      const pointIndex = Number((p as Record<string, unknown>)['index']);
      const numericValue = this.toIndicatorValue(p);
      if (!Number.isNaN(pointIndex) && pointIndex >= 0 && pointIndex < values.length) {
        values[pointIndex] = numericValue;
      }
    });

    return {
      code: `preview-${index}`,
      name,
      pane: meta.pane,
      type: meta.type,
      color: meta.color,
      visible: true,
      values,
    };
  }

  // normalize overlays from backend: resolve Instant time via candle index, ensure type is uppercase
  private toChartOverlays(value: unknown, candles: ChartCandle[]): ChartOverlay[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map((item, idx) => {
      const o = this.asRecord(item);
      const overlayIndex = o['index'] != null ? Number(o['index']) : undefined;
      // resolve time from index or Instant string
      const resolvedTime = overlayIndex != null && overlayIndex >= 0 && overlayIndex < candles.length
        ? candles[overlayIndex]?.time
        : (o['time'] ? String(o['time']) : undefined);

      const startIndex = o['startIndex'] != null ? Number(o['startIndex']) : undefined;
      const endIndex = o['endIndex'] != null ? Number(o['endIndex']) : undefined;

      return {
        id: o['id'] ? String(o['id']) : `overlay-${idx}`,
        type: String(o['type'] ?? 'MARKER') as ChartOverlay['type'],
        category: o['category'] ? String(o['category']) as ChartOverlay['category'] : undefined,
        source: o['source'] ? String(o['source']) as ChartOverlay['source'] : undefined,
        sourceCode: o['sourceCode'] ? String(o['sourceCode']) : undefined,
        index: overlayIndex,
        time: resolvedTime,
        price: o['price'] != null ? this.toNumber(o['price']) : undefined,
        startIndex,
        endIndex,
        startTime: startIndex != null && startIndex >= 0 && startIndex < candles.length
          ? candles[startIndex]?.time
          : (o['startTime'] ? String(o['startTime']) : undefined),
        endTime: endIndex != null && endIndex >= 0 && endIndex < candles.length
          ? candles[endIndex]?.time
          : (o['endTime'] ? String(o['endTime']) : undefined),
        high: o['high'] != null ? this.toNumber(o['high']) : undefined,
        low: o['low'] != null ? this.toNumber(o['low']) : undefined,
        text: o['text'] ? String(o['text']) : undefined,
        color: o['color'] ? String(o['color']) : undefined,
        shape: o['shape'] ? String(o['shape']) : undefined,
        size: o['size'] != null ? Number(o['size']) : undefined,
        visible: true,
      } as ChartOverlay;
    });
  }

  private toIndicatorValue(point: PreviewPoint): number | null {
    if (point.value == null || point.value === '') {
      return null;
    }
    const numericValue = Number(point.value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  private toNumber(value: unknown): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }
}
