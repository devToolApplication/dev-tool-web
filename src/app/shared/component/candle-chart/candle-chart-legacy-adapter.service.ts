import { Injectable } from '@angular/core';

import type {
  CandleChartPayload,
  ChartCandle,
  ChartIndicator,
  ChartOverlay,
} from './candle-chart.models';

@Injectable()
export class CandleChartLegacyAdapter {
  candles(payload: CandleChartPayload): ChartCandle[] {
    return payload.candles.map((candle, index) => ({
      ...candle,
      index,
    }));
  }

  indicators(payload: CandleChartPayload): ChartIndicator[] {
    return payload.indicators.map((indicator) => ({
      name: indicator.name,
      code: indicator.name,
      pane: indicator.pane,
      type: 'LINE',
      color: indicator.color,
      values: indicator.values,
      visible: true,
    }));
  }

  overlays(payload: CandleChartPayload): ChartOverlay[] {
    return [
      ...payload.lines.map((line, index) => ({
        id: `legacy-line-${index}`,
        type: 'TREND_LINE' as const,
        source: 'USER_DRAWING' as const,
        sourceCode: line.name,
        text: line.name,
        color: line.color,
        start: line.start,
        end: line.end,
        startTime: line.startTime,
        endTime: line.endTime,
      })),
      ...payload.boxAreas.map((box, index) => ({
        id: `legacy-box-${index}`,
        type: 'BOX' as const,
        source: 'USER_DRAWING' as const,
        text: box.name,
        color: box.color,
        high: box.high,
        low: box.low,
        startTime: box.startTime,
        endTime: box.endTime,
      })),
      ...payload.points.map((point, index) => ({
        id: `legacy-point-${index}`,
        type: 'MARKER' as const,
        source: 'USER_DRAWING' as const,
        sourceCode: point.name,
        text: point.name,
        color: point.color,
        shape: point.shape,
        time: point.startTime,
        price: point.price,
        size: point.size,
      })),
    ];
  }
}
