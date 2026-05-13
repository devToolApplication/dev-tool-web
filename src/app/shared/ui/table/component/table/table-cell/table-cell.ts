import { Component, Input } from '@angular/core';
import { TableAction, TableColumn } from '../../../models/table-config.model';
import { getValueByPath } from '../../../utils/object.util';

@Component({
  selector: 'app-table-cell',
  standalone: false,
  templateUrl: './table-cell.html',
  styleUrls: ['./table-cell.css']
})
export class TableCellComponent {
  @Input() column!: TableColumn;
  @Input() rowData!: any;

  get value(): any {
    return getValueByPath(this.rowData, this.column.field);
  }

  get actions(): TableAction[] {
    return this.column.actions ?? [];
  }

  get dateValue(): Date | null {
    return this.normalizeDateValue(this.value);
  }

  isActionDisabled(action: TableAction): boolean {
    return action.disabled?.(this.rowData) ?? false;
  }

  onActionClick(action: TableAction): void {
    action.onClick(this.rowData);
  }

  formatArrayValue(value: unknown): string {
    return Array.isArray(value) ? value.join(', ') : String(value ?? '');
  }

  formatTextareaValue(value: unknown): string {
    if (value == null) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  private normalizeDateValue(value: unknown, depth = 0): Date | null {
    if (value == null || value === '' || depth > 3) {
      return null;
    }

    if (value instanceof Date) {
      return this.validDateOrNull(value);
    }

    if (typeof value === 'string') {
      const numericValue = Number(value);
      if (value.trim() !== '' && Number.isFinite(numericValue)) {
        return this.normalizeDateValue(numericValue, depth + 1);
      }

      return this.validDateOrNull(new Date(value));
    }

    if (typeof value === 'number') {
      const epochMillis = Math.abs(value) < 100000000000 ? value * 1000 : value;
      return this.validDateOrNull(new Date(epochMillis));
    }

    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const candidates = [
        record['$date'],
        record['$numberLong'],
        record['date'],
        record['value'],
        record['iso'],
        record['timestamp'],
        record['time'],
        record['epochMillis']
      ];

      for (const candidate of candidates) {
        const normalized = this.normalizeDateValue(candidate, depth + 1);
        if (normalized) {
          return normalized;
        }
      }
    }

    return null;
  }

  private validDateOrNull(value: Date): Date | null {
    return Number.isNaN(value.getTime()) ? null : value;
  }
}

