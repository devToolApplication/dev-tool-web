import { Injectable } from '@angular/core';

import type {
  CandleChartBarChangedEvent,
  CandleChartEvaluationResult,
  CandleChartStrategySignal,
  CandleChartIndicatorPane,
  CandleChartIndicatorType,
  ChartCandle,
  ChartIndicator,
  ChartOverlay,
} from './candle-chart.models';

@Injectable({ providedIn: 'root' })
export class CandleChartOverlayMapper {
  indicatorsFromOverlayRecord(overlays: Record<string, unknown>, candles: ChartCandle[]): ChartIndicator[] {
    return Object.entries(overlays).flatMap(([code, value]) => {
      if (!Array.isArray(value)) {
        return [];
      }

      const values = new Array<number | null>(candles.length).fill(null);
      value.forEach((item) => {
        if (!this.isRecord(item)) {
          return;
        }
        const index = Number(item['index']);
        const numericValue = Number(item['value']);
        if (!Number.isNaN(index) && !Number.isNaN(numericValue) && index >= 0 && index < values.length) {
          values[index] = numericValue;
        }
      });

      const meta = this.resolveIndicatorMeta(code);
      return [
        {
          code,
          name: code,
          pane: meta.pane,
          type: meta.type,
          color: meta.color,
          values,
          visible: true,
        },
      ];
    });
  }

  overlaysFromEvaluation(
    result: CandleChartEvaluationResult | Record<string, unknown> | null | undefined,
    event: CandleChartBarChangedEvent,
  ): ChartOverlay[] {
    if (!result || !this.isRecord(result)) {
      return [];
    }

    const explicit = Array.isArray(result['overlays']) ? (result['overlays'] as ChartOverlay[]) : [];
    const strategy = this.resolveStrategySignal(result);
    if (!strategy || strategy['entry'] !== true) {
      return explicit;
    }

    const time = event.candle.time;
    const index = event.index;
    const entryPrice = this.numberValue(strategy['entryPrice']);
    const stopLoss = this.numberValue(strategy['stopLoss']);
    const takeProfit = this.numberValue(strategy['takeProfit']);
    const side = String(strategy['side'] ?? '').toUpperCase();
    const signalColor =
      side === 'SELL' ? 'var(--app-chart-danger)' : 'var(--app-chart-success)';

    const generated: ChartOverlay[] = [];
    if (entryPrice != null) {
      generated.push({
        id: `evaluation-entry-${index}`,
        type: 'MARKER',
        category: 'ENTRY',
        source: 'STRATEGY',
        sourceCode: 'ENTRY',
        index,
        time,
        price: entryPrice,
        text: side ? `ENTRY ${side}` : 'ENTRY',
        shape: side === 'SELL' ? 'arrowDown' : 'arrowUp',
        color: signalColor,
      });
      generated.push({
        id: `evaluation-entry-line-${index}`,
        type: 'PRICE_LINE',
        category: 'ENTRY',
        source: 'STRATEGY',
        sourceCode: 'ENTRY',
        price: entryPrice,
        text: 'ENTRY',
        color: signalColor,
      });
    }
    if (stopLoss != null) {
      generated.push({
        id: `evaluation-sl-${index}`,
        type: 'PRICE_LINE',
        category: 'STOP_LOSS',
        source: 'STRATEGY',
        sourceCode: 'SL',
        price: stopLoss,
        text: 'SL',
        color: 'var(--app-chart-danger)',
      });
    }
    if (takeProfit != null) {
      generated.push({
        id: `evaluation-tp-${index}`,
        type: 'PRICE_LINE',
        category: 'TAKE_PROFIT',
        source: 'STRATEGY',
        sourceCode: 'TP',
        price: takeProfit,
        text: 'TP',
        color: 'var(--app-chart-success)',
      });
    }

    return [...explicit, ...generated];
  }

  resolveStrategySignal(
    result: CandleChartEvaluationResult | Record<string, unknown>,
  ): CandleChartStrategySignal | Record<string, unknown> | null {
    if (this.isRecord(result['strategy'])) {
      return result['strategy'] as Record<string, unknown>;
    }
    if ('entry' in result || 'entryPrice' in result || 'stopLoss' in result || 'takeProfit' in result) {
      return result;
    }
    return null;
  }

  resolveRuleTrace(
    result: CandleChartEvaluationResult | Record<string, unknown>,
  ): Record<string, unknown> | null {
    if (this.isRecord(result['rule'])) {
      return result['rule'];
    }
    if (this.isRecord(result['trace'])) {
      return result['trace'];
    }
    if ('satisfied' in result || 'children' in result) {
      return result;
    }
    if (this.isRecord(result['entryRuleResult'])) {
      return result['entryRuleResult'];
    }
    return null;
  }

  private numberValue(value: unknown): number | null {
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? null : numericValue;
  }

  private resolveIndicatorMeta(code: string): {
    pane: CandleChartIndicatorPane;
    type: CandleChartIndicatorType;
    color: string;
  } {
    const normalized = code.toLowerCase();
    if (normalized.includes('macd') && (normalized.includes('hist') || normalized.includes('bar'))) {
      return { pane: 'SUB', type: 'HISTOGRAM', color: 'var(--app-chart-warning)' };
    }
    if (normalized.includes('macd')) {
      return {
        pane: 'SUB',
        type: 'LINE',
        color: normalized.includes('signal') ? 'var(--app-chart-danger)' : 'var(--app-chart-info)',
      };
    }
    if (normalized.includes('rsi')) {
      return { pane: 'SUB', type: 'LINE', color: 'var(--app-chart-violet)' };
    }
    if (normalized.includes('bb') || normalized.includes('bollinger')) {
      return { pane: 'MAIN', type: 'LINE', color: 'var(--app-chart-primary)' };
    }
    return { pane: 'MAIN', type: 'LINE', color: 'var(--app-chart-info)' };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
