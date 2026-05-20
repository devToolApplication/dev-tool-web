import { Component, EventEmitter, Input, Output } from '@angular/core';

import type { CandleChartMode, CandleChartStatus } from '../../candle-chart.models';

@Component({
  selector: 'app-candle-chart-toolbar',
  standalone: false,
  templateUrl: './candle-chart-toolbar.component.html',
  styleUrl: './candle-chart-toolbar.component.css',
})
export class CandleChartToolbarComponent {
  @Input() status: CandleChartStatus = 'IDLE';
  @Input() mode: CandleChartMode = 'HISTORICAL';
  @Input() isPlaying = false;
  @Input() fullscreen = false;
  @Input() overlayToggleOptions: Array<{ key: string; label: string }> = [];
  @Input() activeOverlayFilters: Record<string, boolean> = {};

  @Output() readonly overlayToggle = new EventEmitter<string>();
  @Output() readonly fitContent = new EventEmitter<void>();
  @Output() readonly exportImage = new EventEmitter<void>();
  @Output() readonly fullscreenToggle = new EventEmitter<void>();

  statusKey(): string {
    return `tradeBot.chart.status.${this.status.toLowerCase()}`;
  }

  modeKey(): string {
    return `tradeBot.chart.mode.${this.mode.toLowerCase()}`;
  }

  overlayToggleButtonClass(key: string): string {
    return [
      'candle-chart-toggle-button',
      this.activeOverlayFilters[key] !== false ? 'candle-chart-toggle-button--active' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }
}
