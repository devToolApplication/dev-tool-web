export const CANDLE_CHART_WINDOW_BARS = 300;
export const CANDLE_CHART_WINDOW_LIMIT = 360;

export type CandleWindowDirection = 'PAST' | 'FUTURE';

export interface CandleWindowRequest {
  from: string;
  to: string;
  limit: number;
}

export interface BuildInitialCandleWindowInput {
  timeframe: string;
  from?: unknown;
  to?: unknown;
  anchorTo?: unknown;
  bars?: number;
  limit?: number;
}

export interface BuildAdjacentCandleWindowInput {
  direction: CandleWindowDirection;
  timeframe: string;
  firstOpenTime?: unknown;
  lastOpenTime?: unknown;
  minTime?: unknown;
  maxTime?: unknown;
  bars?: number;
  limit?: number;
}

export function buildInitialCandleWindow(input: BuildInitialCandleWindowInput): CandleWindowRequest {
  const timeframeMs = timeframeToMs(input.timeframe);
  const bars = input.bars ?? CANDLE_CHART_WINDOW_BARS;
  const limit = input.limit ?? CANDLE_CHART_WINDOW_LIMIT;
  const minTime = toValidDate(input.from);
  const maxTime = toValidDate(input.to);
  const anchor = toValidDate(input.anchorTo) ?? maxTime ?? new Date();
  const to = maxTime && anchor.getTime() > maxTime.getTime() ? maxTime : anchor;
  const requestedFrom = new Date(to.getTime() - timeframeMs * bars);
  const from = minTime && requestedFrom.getTime() < minTime.getTime() ? minTime : requestedFrom;
  return { from: from.toISOString(), to: to.toISOString(), limit };
}

export function buildAdjacentCandleWindow(input: BuildAdjacentCandleWindowInput): CandleWindowRequest | null {
  const timeframeMs = timeframeToMs(input.timeframe);
  const bars = input.bars ?? CANDLE_CHART_WINDOW_BARS;
  const limit = input.limit ?? CANDLE_CHART_WINDOW_LIMIT;
  const minTime = toValidDate(input.minTime);
  const maxTime = toValidDate(input.maxTime);
  const first = toValidDate(input.firstOpenTime);
  const last = toValidDate(input.lastOpenTime);

  if (input.direction === 'PAST') {
    if (!first || (minTime && first.getTime() <= minTime.getTime())) {
      return null;
    }
    const requestedFrom = new Date(first.getTime() - timeframeMs * bars);
    const from = minTime && requestedFrom.getTime() < minTime.getTime() ? minTime : requestedFrom;
    return { from: from.toISOString(), to: first.toISOString(), limit };
  }

  if (!last || (maxTime && last.getTime() >= maxTime.getTime())) {
    return null;
  }
  const requestedTo = new Date(last.getTime() + timeframeMs * bars);
  const to = maxTime && requestedTo.getTime() > maxTime.getTime() ? maxTime : requestedTo;
  return { from: last.toISOString(), to: to.toISOString(), limit };
}

export function mergeCandlesByOpenTime<T extends { openTime?: unknown }>(current: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();
  [...current, ...incoming].forEach((candle) => {
    const key = String(candle.openTime ?? '');
    if (key) {
      map.set(key, candle);
    }
  });
  return [...map.values()].sort((left, right) => dateTime(left.openTime) - dateTime(right.openTime));
}

export function timeframeToMs(timeframe: string): number {
  const value = String(timeframe ?? '').trim();
  const prefixMinutes = /^M(\d+)$/i.exec(value);
  if (prefixMinutes) {
    return Number(prefixMinutes[1]) * 60_000;
  }

  const suffix = /^(\d+)([mhdw])$/i.exec(value);
  if (suffix) {
    const amount = Number(suffix[1]);
    const unit = suffix[2].toLowerCase();
    if (unit === 'm') {
      return amount * 60_000;
    }
    if (unit === 'h') {
      return amount * 60 * 60_000;
    }
    if (unit === 'd') {
      return amount * 24 * 60 * 60_000;
    }
    return amount * 7 * 24 * 60 * 60_000;
  }

  return 15 * 60_000;
}

function toValidDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const text = String(value ?? '').trim();
  if (!text) {
    return null;
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateTime(value: unknown): number {
  return toValidDate(value)?.getTime() ?? 0;
}
