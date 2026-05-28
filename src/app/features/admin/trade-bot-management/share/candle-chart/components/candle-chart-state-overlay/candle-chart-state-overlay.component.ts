import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-candle-chart-state-overlay',
  standalone: false,
  templateUrl: './candle-chart-state-overlay.component.html',
  styleUrl: './candle-chart-state-overlay.component.css',
})
export class CandleChartStateOverlayComponent {
  @Input() severity: 'loading' | 'error' | 'empty' = 'empty';
  @Input() message = '';
}
