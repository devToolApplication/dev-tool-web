import { Component, Input } from '@angular/core';

import type { ChartCandle } from '../../candle-chart.models';

@Component({
  selector: 'app-candle-chart-header',
  standalone: false,
  templateUrl: './candle-chart-header.component.html',
  styleUrl: './candle-chart-header.component.css',
})
export class CandleChartHeaderComponent {
  @Input() chartTitle = '';
  @Input() candle: ChartCandle | null = null;
  @Input() change = 0;
  @Input() changePercent = 0;
  @Input() tone: 'up' | 'down' | 'flat' = 'flat';

  formatPrice(value: number | undefined): string {
    return Number(value ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  }

  formatVolume(value: number | undefined): string {
    const numericValue = Number(value ?? 0);
    if (Math.abs(numericValue) >= 1_000_000_000) {
      return `${(numericValue / 1_000_000_000).toFixed(2)}B`;
    }
    if (Math.abs(numericValue) >= 1_000_000) {
      return `${(numericValue / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(numericValue) >= 1_000) {
      return `${(numericValue / 1_000).toFixed(2)}K`;
    }
    return numericValue.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}
