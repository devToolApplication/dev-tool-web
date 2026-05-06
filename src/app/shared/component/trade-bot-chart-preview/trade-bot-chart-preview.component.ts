import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TradeBotCandleResponse } from '../../../core/models/trade-bot/chart-query.model';
import { CandleChartConfig, CandleChartPayload } from '../candle-chart/candle-chart';

@Component({
  selector: 'app-trade-bot-chart-preview',
  standalone: false,
  templateUrl: './trade-bot-chart-preview.component.html',
  styleUrl: './trade-bot-chart-preview.component.css'
})
export class TradeBotChartPreviewComponent implements OnChanges {
  @Input() response: TradeBotCandleResponse | null = null;
  @Input() config: CandleChartConfig = {
    showCandles: true,
    showVolume: true,
    showLines: true,
    showBoxAreas: true,
    showPoints: true,
    showIndicators: true
  };

  chartPayload: CandleChartPayload = this.emptyPayload();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['response']) {
      this.chartPayload = this.mapChartPayload(this.response);
    }
  }

  private mapChartPayload(response: TradeBotCandleResponse | null): CandleChartPayload {
    const candles = (response?.candlestickData ?? [])
      .slice()
      .sort((left, right) => left.utcTimeStamp - right.utcTimeStamp)
      .map((item) => ({
        time: this.formatChartTime(item.utcTimeStamp),
        open: item.open,
        close: item.close,
        high: item.high,
        low: item.low,
        volume: item.volume
      }));

    return {
      candles,
      lines: (response?.lineData ?? [])
        .filter((item) => item.from && item.to)
        .map((item) => ({
          name: item.name ?? 'Line',
          color: this.resolveDirectionalColor(item.name, item.color, 'var(--app-chart-info)'),
          start: item.from!.value,
          end: item.to!.value,
          startTime: this.formatChartTime(item.from!.time),
          endTime: this.formatChartTime(item.to!.time)
        })),
      boxAreas: (response?.areaData ?? [])
        .filter((item) => item.from != null && item.to != null && item.maxPrice != null && item.minPrice != null)
        .map((item) => ({
          name: item.name ?? 'Zone',
          color: this.resolveAreaColor(item.name, item.color),
          startTime: this.formatChartTime(item.from!),
          endTime: this.formatChartTime(item.to!),
          high: item.maxPrice!,
          low: item.minPrice!
        })),
      points: (response?.pointData ?? []).map((item) => ({
        name: item.name ?? 'Point',
        color: this.resolveDirectionalColor(item.name, item.color, 'var(--app-chart-warning)'),
        shape: item.shape,
        startTime: this.formatChartTime(this.normalizePointTime(item.time)),
        price: item.value
      })),
      indicators: (response?.indicatorData ?? []).map((item) => ({
        name: item.name ?? 'Indicator',
        color: item.color ?? 'var(--app-chart-violet)',
        pane: item.type === 'SUBCHART' ? ('subchart' as const) : ('overlay' as const),
        values: (item.value ?? []).map((value) => (value == null ? null : Number(value)))
      }))
    };
  }

  private resolveAreaColor(name: string | undefined, color: string | undefined): string {
    const phase = this.resolveTrendPhase(name);
    if (phase === 'uptrend') {
      return 'var(--app-chart-trend-up-fill)';
    }
    if (phase === 'downtrend') {
      return 'var(--app-chart-trend-down-fill)';
    }
    if (phase === 'sideway') {
      return 'var(--app-chart-trend-sideway-fill)';
    }
    return color ?? 'var(--app-chart-primary-fill)';
  }

  private resolveDirectionalColor(name: string | undefined, color: string | undefined, fallback: string): string {
    const phase = this.resolveTrendPhase(name);
    if (phase === 'uptrend') {
      return 'var(--app-chart-trend-up)';
    }
    if (phase === 'downtrend') {
      return 'var(--app-chart-trend-down)';
    }
    if (phase === 'sideway') {
      return 'var(--app-chart-trend-sideway)';
    }
    return color ?? fallback;
  }

  private resolveTrendPhase(name: string | undefined): 'uptrend' | 'downtrend' | 'sideway' | null {
    const normalized = String(name ?? '').toUpperCase();
    if (normalized.includes('UPTREND') || normalized.includes('UP TREND')) {
      return 'uptrend';
    }
    if (normalized.includes('DOWNTREND') || normalized.includes('DOWN TREND')) {
      return 'downtrend';
    }
    if (normalized.includes('SIDEWAY') || normalized.includes('SIDEWAYS') || normalized.includes('NO TREND')) {
      return 'sideway';
    }
    return null;
  }

  private formatChartTime(value: number): string {
    const date = new Date(value);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day} ${hours}:${minutes}`;
  }

  private normalizePointTime(value: number): number {
    return value < 1_000_000_000_000 ? value * 1000 : value;
  }

  private emptyPayload(): CandleChartPayload {
    return {
      candles: [],
      lines: [],
      boxAreas: [],
      points: [],
      indicators: []
    };
  }
}
