import { Component, Input } from '@angular/core';
import { BadgeVariant } from '../badge/badge.component';

export type ValueDisplayType =
  | 'text'
  | 'number'
  | 'currency'
  | 'percent'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'badge'
  | 'copyable'
  | 'json';

@Component({
  selector: 'app-value-display',
  standalone: false,
  templateUrl: './value-display.component.html',
  styleUrl: './value-display.component.css'
})
export class ValueDisplayComponent {
  @Input() value: unknown;
  @Input() type: ValueDisplayType = 'text';
  @Input() emptyValue = '-';
  @Input() variant: BadgeVariant = 'default';
  @Input() format?: string;
  @Input() shorten = true;
  @Input() currencyCode = 'USD';
  @Input() prefix = '';
  @Input() suffix = '';

  get dateValue(): Date | null {
    if (this.value instanceof Date) {
      return this.value;
    }
    if (typeof this.value === 'string' || typeof this.value === 'number') {
      const date = new Date(this.value);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  get numberValue(): number | null {
    if (typeof this.value === 'number') {
      return this.value;
    }
    if (typeof this.value === 'string' && this.value.trim() !== '') {
      const parsed = Number(this.value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  get textValue(): string {
    if (this.value === null || this.value === undefined || this.value === '') {
      return this.emptyValue;
    }
    return String(this.value);
  }
}
