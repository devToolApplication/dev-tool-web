import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-candle-chart-replay-controls',
  standalone: false,
  templateUrl: './candle-chart-replay-controls.component.html',
  styleUrl: './candle-chart-replay-controls.component.css',
})
export class CandleChartReplayControlsComponent {
  @Input() isPlaying = false;
  @Input() speedMs = 650;
  @Input() speedOptions: Array<{ label: string; value: number }> = [];

  @Output() readonly first = new EventEmitter<void>();
  @Output() readonly previous = new EventEmitter<void>();
  @Output() readonly play = new EventEmitter<void>();
  @Output() readonly pause = new EventEmitter<void>();
  @Output() readonly next = new EventEmitter<void>();
  @Output() readonly last = new EventEmitter<void>();
  @Output() readonly speedChange = new EventEmitter<number>();
}
