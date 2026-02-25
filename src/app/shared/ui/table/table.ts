import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TableConfig } from './models/table-config.model';

@Component({
  selector: 'app-table',
  standalone: false,
  templateUrl: './table.html',
  styleUrls: ['./table.css']
})
export class TableComponent {
  @Input() config!: TableConfig;
  @Input() data: any[] = [];
  @Input() loading = false;

  @Output() search = new EventEmitter<Record<string, any>>();
  @Output() resetFilter = new EventEmitter<void>();

  onSearch(filters: Record<string, any>): void {
    this.search.emit(filters);
  }

  onResetFilter(): void {
    this.resetFilter.emit();
  }
}
