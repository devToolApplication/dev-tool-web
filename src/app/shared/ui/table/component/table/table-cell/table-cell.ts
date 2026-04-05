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
}

