import { computed, Injectable, signal } from '@angular/core';

import type {
  CandleChartMode,
  CandleChartStatus,
  ChartCandle,
  ChartIndicator,
  ChartOverlay,
  ReplayConfig,
} from './candle-chart.models';

@Injectable()
export class CandleChartStoreService {
  readonly mode = signal<CandleChartMode>('HISTORICAL');
  readonly status = signal<CandleChartStatus>('IDLE');
  readonly candles = signal<ChartCandle[]>([]);
  readonly indicators = signal<ChartIndicator[]>([]);
  readonly overlays = signal<ChartOverlay[]>([]);
  readonly currentIndex = signal(0);
  readonly selectedCandle = signal<ChartCandle | null>(null);
  readonly speedMs = signal(650);

  readonly currentCandle = computed(() => this.candles()[this.currentIndex()] ?? null);
  readonly visibleCandles = computed(() => {
    const candles = this.candles();
    if (this.mode() !== 'REPLAY') {
      return candles;
    }
    return candles.slice(0, this.currentIndex() + 1);
  });

  configure(
    mode: CandleChartMode,
    candles: ChartCandle[],
    indicators: ChartIndicator[],
    overlays: ChartOverlay[],
    replayConfig: ReplayConfig | null | undefined,
    resetIndex: boolean,
  ): void {
    this.mode.set(mode);
    this.candles.set(candles);
    this.indicators.set(indicators);
    this.overlays.set(overlays);
    this.speedMs.set(Math.max(50, Number(replayConfig?.speedMs ?? this.speedMs())));

    if (resetIndex || this.currentIndex() >= candles.length) {
      this.currentIndex.set(this.resolveInitialIndex(mode, candles.length, replayConfig));
    }

    this.status.set(candles.length ? 'READY' : 'IDLE');
  }

  setStatus(status: CandleChartStatus): void {
    this.status.set(status);
  }

  setCurrentIndex(index: number): ChartCandle | null {
    const boundedIndex = this.clampIndex(index);
    this.currentIndex.set(boundedIndex);
    return this.candles()[boundedIndex] ?? null;
  }

  setSelectedCandle(candle: ChartCandle | null): void {
    this.selectedCandle.set(candle);
  }

  appendRealtimeCandle(candle: ChartCandle): number {
    const nextCandles = [...this.candles()];
    const existingIndex = nextCandles.findIndex((item) => String(item.time) === String(candle.time));
    if (existingIndex >= 0) {
      nextCandles[existingIndex] = { ...nextCandles[existingIndex], ...candle, index: existingIndex };
      this.candles.set(nextCandles);
      this.currentIndex.set(existingIndex);
      return existingIndex;
    }

    const index = nextCandles.length;
    nextCandles.push({ ...candle, index });
    this.candles.set(nextCandles);
    this.currentIndex.set(index);
    return index;
  }

  replaceRealtimeState(candles: ChartCandle[], overlays: ChartOverlay[]): void {
    this.candles.set(candles.map((candle, index) => ({ ...candle, index })));
    this.overlays.set(overlays);
    this.currentIndex.set(this.clampIndex(candles.length - 1));
    this.status.set(candles.length ? 'READY' : 'IDLE');
  }

  private resolveInitialIndex(
    mode: CandleChartMode,
    length: number,
    replayConfig: ReplayConfig | null | undefined,
  ): number {
    if (length <= 0) {
      return 0;
    }
    if (mode === 'REPLAY') {
      return this.clampStaticIndex(Number(replayConfig?.initialIndex ?? 0), length);
    }
    return length - 1;
  }

  private clampIndex(index: number): number {
    return this.clampStaticIndex(index, this.candles().length);
  }

  private clampStaticIndex(index: number, length: number): number {
    if (length <= 0) {
      return 0;
    }
    return Math.min(Math.max(Math.trunc(index), 0), length - 1);
  }
}
