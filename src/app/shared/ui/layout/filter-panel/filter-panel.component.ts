import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, signal } from '@angular/core';

export type FilterPanelType =
  | 'text'
  | 'select'
  | 'multi-select'
  | 'date-range'
  | 'number-range'
  | 'boolean'
  | 'autocomplete';

export interface FilterPanelOption {
  label: string;
  value: string | number | boolean | null;
  disabled?: boolean;
}

export interface FilterPanelField {
  key: string;
  label: string;
  type: FilterPanelType;
  options?: FilterPanelOption[];
  placeholder?: string;
  advanced?: boolean;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

export interface FilterPanelConfig {
  filters: FilterPanelField[];
  advancedCollapsed?: boolean;
}

@Component({
  selector: 'app-filter-panel',
  standalone: false,
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.css'
})
export class FilterPanelComponent implements OnChanges, OnDestroy {
  @Input() filters: FilterPanelField[] = [];
  @Input() advancedCollapsed = true;
  @Input() values: Record<string, unknown> = {};
  @Input() initialValues: Record<string, unknown> = {};
  @Input() searchDebounceMs = 250;

  @Output() apply = new EventEmitter<Record<string, unknown>>();
  @Output() reset = new EventEmitter<void>();
  @Output() retryOptions = new EventEmitter<FilterPanelField>();
  @Output() valueChange = new EventEmitter<Record<string, unknown>>();

  readonly showAdvanced = signal(false);
  private readonly debounceTimers = new Map<string, number>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['advancedCollapsed']) {
      this.showAdvanced.set(!this.advancedCollapsed);
    }
  }

  ngOnDestroy(): void {
    this.clearDebounceTimers();
  }

  get simpleFilters(): FilterPanelField[] {
    return this.filters.filter((field) => !field.advanced);
  }

  get advancedFilters(): FilterPanelField[] {
    return this.filters.filter((field) => field.advanced);
  }

  get activeCount(): number {
    return Object.values(this.values ?? {}).filter((value) => {
      if (this.isRangeValue(value)) {
        return this.hasValue(value['from']) || this.hasValue(value['to']);
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return this.hasValue(value);
    }).length;
  }

  get dirty(): boolean {
    return JSON.stringify(this.values ?? {}) !== JSON.stringify(this.initialValues ?? {});
  }

  setValue(key: string, value: unknown): void {
    this.values = { ...this.values, [key]: value };
    this.valueChange.emit(this.values);
  }

  setDebouncedValue(key: string, value: unknown): void {
    const delay = Math.max(0, this.searchDebounceMs);
    if (delay === 0) {
      this.setValue(key, value);
      return;
    }

    const current = this.debounceTimers.get(key);
    if (current !== undefined) {
      window.clearTimeout(current);
    }

    const timer = window.setTimeout(() => {
      this.debounceTimers.delete(key);
      this.setValue(key, value);
    }, delay);
    this.debounceTimers.set(key, timer);
  }

  selectValue(key: string): string | number | boolean | null {
    const value = this.values[key];
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null ? value : null;
  }

  multiValue(key: string): Array<string | number> {
    const value = this.values[key];
    return Array.isArray(value)
      ? value.filter((item): item is string | number => typeof item === 'string' || typeof item === 'number')
      : [];
  }

  textValue(key: string): string {
    const value = this.values[key];
    return value == null ? '' : String(value);
  }

  rangeValue(key: string, edge: 'from' | 'to'): Date | null {
    const value = this.values[key];
    if (!this.isRangeValue(value)) {
      return null;
    }
    const edgeValue = value[edge];
    return edgeValue instanceof Date ? edgeValue : edgeValue ? new Date(String(edgeValue)) : null;
  }

  dateRangeValue(key: string): Date[] | null {
    const from = this.rangeValue(key, 'from');
    const to = this.rangeValue(key, 'to');
    const range = [from, to].filter((value): value is Date => value instanceof Date);
    return range.length ? range : null;
  }

  numberRangeValue(key: string, edge: 'from' | 'to'): number | null {
    const value = this.values[key];
    if (!this.isRangeValue(value)) {
      return null;
    }
    const edgeValue = value[edge];
    return typeof edgeValue === 'number' ? edgeValue : edgeValue == null || edgeValue === '' ? null : Number(edgeValue);
  }

  setRangeValue(key: string, edge: 'from' | 'to', value: unknown): void {
    const current = this.values[key];
    const next: Partial<Record<'from' | 'to', unknown>> = this.isRangeValue(current) ? { ...current } : {};
    next[edge] = value;
    this.setValue(key, next);
  }

  setDateRangeValue(key: string, value: Date | Date[] | null): void {
    const range = Array.isArray(value) ? value : [];
    this.setValue(key, {
      from: range[0] ?? null,
      to: range[1] ?? null
    });
  }

  clear(): void {
    this.values = {};
    this.valueChange.emit(this.values);
    this.reset.emit();
  }

  onReset(): void {
    this.values = { ...(this.initialValues ?? {}) };
    this.valueChange.emit(this.values);
    this.reset.emit();
  }

  onApply(): void {
    this.apply.emit(this.values);
  }

  toggleAdvanced(): void {
    this.showAdvanced.update((value) => !value);
  }

  private hasValue(value: unknown): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  private isRangeValue(value: unknown): value is Record<'from' | 'to', unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private clearDebounceTimers(): void {
    this.debounceTimers.forEach((timer) => window.clearTimeout(timer));
    this.debounceTimers.clear();
  }
}
