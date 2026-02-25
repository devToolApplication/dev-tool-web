import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TableFilterField } from '../../models/table-config.model';

@Component({
  selector: 'app-table-filter',
  standalone: false,
  templateUrl: './table-filter.html',
  styleUrls: ['./table-filter.css']
})
export class TableFilterComponent {
  @Input() fields: TableFilterField[] = [];
  @Input() loading = false;

  @Output() search = new EventEmitter<Record<string, any>>();
  @Output() reset = new EventEmitter<void>();

  values: Record<string, any> = {};

  onSearch(): void {
    const payload = Object.entries(this.values).reduce<Record<string, any>>((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    this.search.emit(payload);
  }

  onReset(): void {
    this.values = {};
    this.reset.emit();
  }
}
