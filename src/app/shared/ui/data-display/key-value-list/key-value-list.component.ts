import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BadgeVariant } from '../badge/badge.component';

export type KeyValueType =
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
export type KeyValueLayout = 'one-column' | 'two-column';

export interface KeyValueItem {
  label: string;
  value: unknown;
  type?: KeyValueType;
  variant?: BadgeVariant;
  copyable?: boolean;
  emptyValue?: string;
  format?: string;
  currencyCode?: string;
  prefix?: string;
  suffix?: string;
}

@Component({
  selector: 'app-key-value-list',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './key-value-list.component.html',
  styleUrl: './key-value-list.component.css'
})
export class KeyValueListComponent {
  @Input() items: KeyValueItem[] = [];
  @Input() layout: KeyValueLayout = 'two-column';
  @Input() emptyValue = '-';

  displayValue(item: KeyValueItem): string {
    const value = item.value;
    if (value == null || value === '') {
      return item.emptyValue ?? this.emptyValue;
    }
    return String(value);
  }

  dateValue(item: KeyValueItem): string | number | Date | null {
    const value = item.value;
    return typeof value === 'string' || typeof value === 'number' || value instanceof Date ? value : null;
  }

  numberValue(item: KeyValueItem): number | null {
    const value = item.value;
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }
}
