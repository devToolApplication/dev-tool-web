import { Injectable } from '@angular/core';
import type { Time, UTCTimestamp } from 'lightweight-charts';

import type { CandleChartTime, ChartCandle } from './candle-chart.models';

export type CandleChartTimeBoundary = 'floor' | 'ceil' | 'nearest';

export interface NormalizedCandle {
  source: ChartCandle;
  time: Time;
  sortTime: number;
  key: string;
}

export interface TimeNormalizationContext {
  lookup: Map<string, Time>;
  candles: NormalizedCandle[];
}

@Injectable()
export class CandleChartTimeUtil {
  toUnixSeconds(value: CandleChartTime | null | undefined, fallbackIndex = 0): number {
    if (typeof value === 'number') {
      return value > 1_000_000_000_000 ? Math.floor(value / 1000) : Math.floor(value);
    }

    if (this.isBusinessDay(value)) {
      return Date.UTC(value.year, value.month - 1, value.day) / 1000;
    }

    const rawValue = String(value ?? '').trim();
    const timeOnly = rawValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeOnly) {
      return (
        Date.UTC(2000, 0, 1, Number(timeOnly[1]), Number(timeOnly[2]), Number(timeOnly[3] ?? 0)) /
        1000
      );
    }

    const parsedTime = Date.parse(rawValue.replace(' ', 'T'));
    if (!Number.isNaN(parsedTime)) {
      return Math.floor(parsedTime / 1000);
    }

    return Date.UTC(2000, 0, 1, 0, fallbackIndex, 0) / 1000;
  }

  normalizeCandles(candles: ChartCandle[]): NormalizedCandle[] {
    const normalized = candles.map((candle, fallbackIndex) => {
      const source = {
        ...candle,
        index: candle.index ?? fallbackIndex,
        time: candle.time ?? candle.openTime ?? candle.closeTime ?? fallbackIndex,
      };
      const sortTime = this.toUnixSeconds(source.time, fallbackIndex);
      return {
        source,
        time: sortTime as UTCTimestamp,
        sortTime,
        key: String(sortTime),
      };
    });

    const byTime = new Map<string, NormalizedCandle>();
    normalized
      .sort((left, right) => left.sortTime - right.sortTime)
      .forEach((item) => byTime.set(item.key, item));

    return Array.from(byTime.values()).map((item, index) => ({
      ...item,
      source: { ...item.source, index },
    }));
  }

  buildTimeNormalizationContext(candles: NormalizedCandle[]): TimeNormalizationContext {
    const lookup = new Map<string, Time>();
    candles.forEach((item) => {
      lookup.set(String(item.source.time), item.time);
      lookup.set(item.key, item.time);
      lookup.set(String(item.sortTime * 1000), item.time);
      if (item.source.openTime != null) {
        lookup.set(String(item.source.openTime), item.time);
      }
      if (item.source.closeTime != null) {
        lookup.set(String(item.source.closeTime), item.time);
      }
      if (item.source.index != null) {
        lookup.set(`index:${item.source.index}`, item.time);
      }
    });
    return { lookup, candles };
  }

  normalizeExternalTime(
    value: CandleChartTime,
    timeContext: TimeNormalizationContext,
    boundary: CandleChartTimeBoundary,
  ): Time {
    const directMatch = timeContext.lookup.get(String(value));
    if (directMatch != null) {
      return directMatch;
    }

    const sortTime = this.toUnixSeconds(value, 0);
    return this.resolveBoundaryTime(sortTime, timeContext.candles, boundary) ?? (sortTime as UTCTimestamp);
  }

  timeByIndex(index: number | undefined, timeContext: TimeNormalizationContext): Time | null {
    if (index == null) {
      return null;
    }
    return timeContext.lookup.get(`index:${index}`) ?? timeContext.candles[index]?.time ?? null;
  }

  compareTimes(left: Time, right: Time): number {
    return this.toTimeSortValue(left) - this.toTimeSortValue(right);
  }

  toTimeSortValue(time: Time): number {
    if (typeof time === 'number') {
      return time;
    }
    if (typeof time === 'string') {
      const parsed = Date.parse(time.replace(' ', 'T'));
      return Number.isNaN(parsed) ? 0 : Math.floor(parsed / 1000);
    }
    return Date.UTC(time.year, time.month - 1, time.day) / 1000;
  }

  nextCandleTime(time: Time, timeContext: TimeNormalizationContext): Time | null {
    const sortTime = this.toTimeSortValue(time);
    const index = timeContext.candles.findIndex((candle) => candle.sortTime > sortTime);
    return index === -1 ? null : timeContext.candles[index].time;
  }

  private resolveBoundaryTime(
    sortTime: number,
    candles: NormalizedCandle[],
    boundary: CandleChartTimeBoundary,
  ): Time | null {
    if (candles.length === 0) {
      return null;
    }

    const ceilIndex = this.findFirstCandleIndexAtOrAfter(sortTime, candles);
    const floorIndex = ceilIndex >= candles.length ? candles.length - 1 : Math.max(ceilIndex - 1, 0);

    if (boundary === 'ceil') {
      return candles[Math.min(ceilIndex, candles.length - 1)].time;
    }

    if (boundary === 'floor') {
      if (ceilIndex < candles.length && candles[ceilIndex].sortTime === sortTime) {
        return candles[ceilIndex].time;
      }
      return candles[floorIndex].time;
    }

    const ceilCandle = candles[Math.min(ceilIndex, candles.length - 1)];
    const floorCandle = candles[floorIndex];
    return Math.abs(ceilCandle.sortTime - sortTime) < Math.abs(sortTime - floorCandle.sortTime)
      ? ceilCandle.time
      : floorCandle.time;
  }

  private findFirstCandleIndexAtOrAfter(sortTime: number, candles: NormalizedCandle[]): number {
    let low = 0;
    let high = candles.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (candles[middle].sortTime < sortTime) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    return low;
  }

  private isBusinessDay(value: unknown): value is { year: number; month: number; day: number } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'year' in value &&
      'month' in value &&
      'day' in value
    );
  }
}
