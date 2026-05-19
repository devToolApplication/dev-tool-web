import { Component, Input } from '@angular/core';
import { BadgeVariant } from '../data-display/badge/badge.component';

@Component({
  selector: 'app-summary-metric-card',
  standalone: false,
  templateUrl: './summary-metric-card.component.html',
  styleUrl: './summary-metric-card.component.css'
})
export class SummaryMetricCardComponent {
  @Input({ required: true }) label = '';
  @Input() value: string | number | null = null;
  @Input() prefix = '';
  @Input() suffix = '';
  @Input() emptyValue = 'notAvailable';
  @Input() loading = false;
  @Input() error?: string | null;
  @Input() trend?: string | number | null;
  @Input() trendVariant: BadgeVariant = 'default';
  @Input() routerLink?: string | any[];
  @Input() queryParams?: Record<string, unknown>;

  get displayValue(): string | number {
    return this.value ?? this.emptyValue;
  }

  get trendLabel(): string {
    return this.trend == null ? '' : String(this.trend);
  }
}
