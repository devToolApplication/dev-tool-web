import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, computed, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { TableFilterField, TableFilterOption, TableFilterOptions } from '../../../models/table-config.model';

@Component({
  selector: 'app-table-filter',
  standalone: false,
  templateUrl: './table-filter.html',
  styleUrls: ['./table-filter.css']
})
export class TableFilterComponent implements OnInit, OnChanges, OnDestroy {
  @Input() fields: TableFilterField[] = [];
  @Input() options: TableFilterOptions = {};
  @Input() loading = false;

  @Output() search = new EventEmitter<Record<string, any>>();
  @Output() reset = new EventEmitter<void>();

  readonly searchValue = signal('');
  readonly draftValues = signal<Record<string, any>>({});
  readonly appliedValues = signal<Record<string, any>>({});
  readonly drawerOpen = signal(false);
  readonly visibleAdvancedFields = computed(() => this.fields.filter((field) => !field.hidden));

  private readonly destroy$ = new Subject<void>();
  private initialized = false;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const initialValues = this.buildInitialValues(params);
      this.draftValues.set(initialValues);
      this.appliedValues.set(this.cloneValue(initialValues));
      this.searchValue.set(this.getPrimaryFieldValue(initialValues));

      if (!this.initialized) {
        this.initialized = true;
        queueMicrotask(() => this.emitSearch(this.appliedValues()));
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['fields'] || changes['options']) && this.initialized) {
      const currentApplied = this.appliedValues();
      const nextValues = this.fields.reduce<Record<string, any>>((acc, field) => {
        if (Object.prototype.hasOwnProperty.call(currentApplied, field.field)) {
          acc[field.field] = this.cloneValue(currentApplied[field.field]);
          return acc;
        }

        acc[field.field] = this.getDefaultValue(field);
        return acc;
      }, {});

      this.draftValues.set(this.cloneValue(nextValues));
      this.appliedValues.set(nextValues);
      this.searchValue.set(this.getPrimaryFieldValue(nextValues));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInputChange(value: string | null): void {
    const nextValue = value ?? '';
    this.searchValue.set(nextValue);
    const primaryField = this.primaryFieldConfig;
    if (!primaryField) {
      return;
    }

    this.draftValues.update((current) => ({
      ...current,
      [primaryField.field]: nextValue
    }));
  }

  onSearch(): void {
    const primaryField = this.primaryFieldConfig;
    const nextApplied = this.cloneValue(this.appliedValues());

    if (primaryField) {
      nextApplied[primaryField.field] = this.normalizedSearchValue;
    }

    this.appliedValues.set(nextApplied);
    this.draftValues.update((current) => ({
      ...current,
      ...(primaryField ? { [primaryField.field]: this.normalizedSearchValue } : {})
    }));
    this.syncQueryParams(nextApplied);
    this.emitSearch(nextApplied);
  }

  openDrawer(): void {
    this.draftValues.set(this.cloneValue(this.appliedValues()));
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.draftValues.set(this.cloneValue(this.appliedValues()));
    this.searchValue.set(this.getPrimaryFieldValue(this.appliedValues()));
    this.drawerOpen.set(false);
  }

  onApplyAdvanced(): void {
    const nextApplied = this.cloneValue(this.draftValues());
    this.appliedValues.set(nextApplied);
    this.searchValue.set(this.getPrimaryFieldValue(nextApplied));
    this.syncQueryParams(nextApplied);
    this.emitSearch(nextApplied);
    this.drawerOpen.set(false);
  }

  onReset(): void {
    const defaults = this.buildDefaultValues();
    this.draftValues.set(defaults);
    this.appliedValues.set(this.cloneValue(defaults));
    this.searchValue.set(this.getPrimaryFieldValue(defaults));
    this.syncQueryParams(defaults);
    this.reset.emit();
    this.emitSearch(defaults);
    this.drawerOpen.set(false);
  }

  onFieldChange(field: TableFilterField, value: any): void {
    const normalizedValue = this.normalizeFieldValue(field, value);
    const nextValues = {
      ...this.draftValues(),
      [field.field]: normalizedValue
    };

    this.draftValues.set(nextValues);
    if (this.primaryFieldConfig?.field === field.field) {
      this.searchValue.set(String(normalizedValue ?? ''));
    }
  }

  valueOf(field: TableFilterField): any {
    return this.draftValues()[field.field];
  }

  optionsOf(field: TableFilterField): TableFilterOption[] {
    if (field.options?.length) {
      return field.options;
    }

    if (field.type === 'boolean') {
      return [
        { label: 'yes', value: true },
        { label: 'no', value: false }
      ];
    }

    return [];
  }

  get primaryFieldConfig(): TableFilterField | undefined {
    const configuredField = this.options.primaryField;
    if (configuredField) {
      return this.fields.find((field) => field.field === configuredField);
    }

    return this.fields.find((field) => !field.hidden) ?? this.fields[0];
  }

  get inputPlaceholder(): string {
    return this.primaryFieldConfig?.placeholder ?? this.primaryFieldConfig?.label ?? 'search';
  }

  get normalizedSearchValue(): string {
    return this.searchValue().trim();
  }

  private buildInitialValues(params: ParamMap): Record<string, any> {
    const defaults = this.buildDefaultValues();

    return this.fields.reduce<Record<string, any>>((acc, field) => {
      if (field.type === 'date-range') {
        const startKey = field.queryParamStart ?? `${field.field}From`;
        const endKey = field.queryParamEnd ?? `${field.field}To`;
        acc[field.field] = {
          start: params.get(startKey) ?? '',
          end: params.get(endKey) ?? ''
        };
        return acc;
      }

      const queryKey = field.queryParam ?? field.field;
      const raw = params.get(queryKey);
      if (raw == null) {
        acc[field.field] = defaults[field.field];
        return acc;
      }

      acc[field.field] = this.parseQueryValue(field, raw);
      return acc;
    }, { ...defaults });
  }

  private buildDefaultValues(): Record<string, any> {
    return this.fields.reduce<Record<string, any>>((acc, field) => {
      acc[field.field] = this.getDefaultValue(field);
      return acc;
    }, {});
  }

  private getDefaultValue(field: TableFilterField): any {
    if (field.defaultValue !== undefined) {
      return this.cloneValue(field.defaultValue);
    }

    switch (field.type) {
      case 'multi-select':
        return [];
      case 'date-range':
        return { start: '', end: '' };
      default:
        return null;
    }
  }

  private getPrimaryFieldValue(values: Record<string, any>): string {
    const primaryField = this.primaryFieldConfig;
    const value = primaryField ? values[primaryField.field] : '';
    return String(value ?? '');
  }

  private normalizeFieldValue(field: TableFilterField, value: any): any {
    if (field.type === 'multi-select') {
      return Array.isArray(value) ? value : [];
    }

    if (field.type === 'date-range') {
      return {
        start: value?.start ?? '',
        end: value?.end ?? ''
      };
    }

    return value;
  }

  private parseQueryValue(field: TableFilterField, raw: string): any {
    if (field.type === 'multi-select') {
      return raw.split(',').filter(Boolean);
    }

    if (field.type === 'boolean') {
      if (raw === 'true') return true;
      if (raw === 'false') return false;
      return null;
    }

    return raw;
  }

  private syncQueryParams(values: Record<string, any>): void {
    if (!this.enableUrlSync) {
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.serializeToQueryParams(values),
      queryParamsHandling: 'merge'
    });
  }

  private serializeToQueryParams(values: Record<string, any>): Record<string, any> {
    return this.fields.reduce<Record<string, any>>((acc, field) => {
      const value = values[field.field];

      if (field.type === 'date-range') {
        acc[field.queryParamStart ?? `${field.field}From`] = value?.start || null;
        acc[field.queryParamEnd ?? `${field.field}To`] = value?.end || null;
        return acc;
      }

      const queryKey = field.queryParam ?? field.field;
      if (Array.isArray(value)) {
        acc[queryKey] = value.length ? value.join(',') : null;
        return acc;
      }

      acc[queryKey] = this.hasValue(value) ? value : null;
      return acc;
    }, {});
  }

  private emitSearch(values: Record<string, any>): void {
    this.search.emit(this.normalizePayload(values));
  }

  private normalizePayload(values: Record<string, any>): Record<string, any> {
    return this.fields.reduce<Record<string, any>>((acc, field) => {
      const value = values[field.field];

      if (field.type === 'date-range') {
        if (this.hasValue(value?.start)) {
          acc[field.queryParamStart ?? `${field.field}From`] = value.start;
        }
        if (this.hasValue(value?.end)) {
          acc[field.queryParamEnd ?? `${field.field}To`] = value.end;
        }
        return acc;
      }

      if (Array.isArray(value)) {
        if (value.length) {
          acc[field.field] = value;
        }
        return acc;
      }

      if (this.hasValue(value)) {
        acc[field.field] = value;
      }
      return acc;
    }, {});
  }

  private hasValue(value: any): boolean {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (value && typeof value === 'object') {
      return Object.values(value).some((item) => this.hasValue(item));
    }

    return value !== null && value !== undefined && value !== '';
  }

  private get enableUrlSync(): boolean {
    return this.options.enableUrlSync !== false;
  }

  private cloneValue<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }
}
