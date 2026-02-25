import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { TableFilterField, TableFilterOptions } from '../../models/table-config.model';

@Component({
  selector: 'app-table-filter',
  standalone: false,
  templateUrl: './table-filter.html',
  styleUrls: ['./table-filter.css']
})
export class TableFilterComponent implements OnChanges {
  @Input() fields: TableFilterField[] = [];
  @Input() options: TableFilterOptions = {};
  @Input() loading = false;

  @Output() search = new EventEmitter<Record<string, any>>();
  @Output() reset = new EventEmitter<void>();

  values: Record<string, any> = {};
  showAllFilters = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields'] || changes['options']) {
      this.showAllFilters = false;
    }
  }

  get visibleFields(): TableFilterField[] {
    const availableFields = this.fields.filter((field) => !field.hidden);

    if (this.showAllFilters) {
      return availableFields;
    }

    const defaultVisibleFields = availableFields.filter((field) => field.defaultVisible === true);
    if (defaultVisibleFields.length > 0) {
      return defaultVisibleFields;
    }

    const fallbackCount = this.options.defaultVisibleCount ?? 3;
    return availableFields.slice(0, fallbackCount);
  }

  get hasCollapsedFilters(): boolean {
    const availableFields = this.fields.filter((field) => !field.hidden);
    return availableFields.length > this.visibleFields.length;
  }

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

  toggleFilters(): void {
    this.showAllFilters = !this.showAllFilters;
  }
}
