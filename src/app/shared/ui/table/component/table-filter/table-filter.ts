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
  showFieldSelector = false;

  private selectedFieldKeys = new Set<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields'] || changes['options']) {
      this.resetFieldState();
    }
  }

  get selectableFields(): TableFilterField[] {
    return this.fields;
  }

  get selectedFields(): TableFilterField[] {
    return this.selectableFields.filter((field) => this.selectedFieldKeys.has(field.field));
  }

  get visibleFields(): TableFilterField[] {
    const selected = this.selectedFields;

    if (this.showAllFilters) {
      return selected;
    }

    const defaultVisibleFields = selected.filter((field) => field.defaultVisible === true);
    if (defaultVisibleFields.length > 0) {
      return defaultVisibleFields;
    }

    const fallbackCount = this.options.defaultVisibleCount ?? 3;
    return selected.slice(0, fallbackCount);
  }

  get hasCollapsedFilters(): boolean {
    return this.selectedFields.length > this.visibleFields.length;
  }

  get hiddenSelectedCount(): number {
    return this.selectedFields.length - this.visibleFields.length;
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

  toggleFieldSelector(): void {
    this.showFieldSelector = !this.showFieldSelector;
  }

  isFieldSelected(fieldKey: string): boolean {
    return this.selectedFieldKeys.has(fieldKey);
  }

  toggleFieldSelection(fieldKey: string): void {
    if (this.selectedFieldKeys.has(fieldKey)) {
      if (this.selectedFieldKeys.size === 1) {
        return;
      }

      this.selectedFieldKeys.delete(fieldKey);
      this.values[fieldKey] = null;
      return;
    }

    this.selectedFieldKeys.add(fieldKey);
  }

  private resetFieldState(): void {
    this.showAllFilters = false;
    this.showFieldSelector = false;

    const defaultSelected = this.fields.filter((field) => !field.hidden).map((field) => field.field);
    this.selectedFieldKeys = new Set<string>(defaultSelected);

    if (this.selectedFieldKeys.size === 0 && this.fields.length > 0) {
      this.selectedFieldKeys.add(this.fields[0].field);
    }
  }
}
