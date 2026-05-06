import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-summary-metric-card',
  standalone: false,
  templateUrl: './summary-metric-card.component.html',
  styleUrl: './summary-metric-card.component.css'
})
export class SummaryMetricCardComponent {
  @Input({ required: true }) label = '';
  @Input() value: string | number | null = null;
  @Input() suffix = '';
}
