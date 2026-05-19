import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { from, isObservable, of, Subject, takeUntil } from 'rxjs';
import { TableFilterField, TableFilterOption, TableFilterOptions } from '../../../models/table-config.model';
import { ExpressionEngine } from '../../../../form-input/utils/expression.engine';

interface TableFilterChip {
  field: TableFilterField;
  label: string;
  valueLabel: string;
}

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
  @Input() searchDebounceMs = 250;

  @Output() search = new EventEmitter<Record<string, any>>();
  @Output() reset = new EventEmitter<void>();

  readonly searchValue = signal('');
  readonly draftValues = signal<Record<string, any>>({});
  readonly appliedValues = signal<Record<string, any>>({});
  readonly drawerOpen = signal(false);
  readonly optionState = signal<Record<string, { options: TableFilterOption[]; loading: boolean; error: string | null }>>({});

  private readonly destroy$ = new Subject<void>();
  private readonly expressionEngine = new ExpressionEngine();
  private readonly optionLoadVersion = new Map<string, number>();
  private searchTimer?: ReturnType<typeof setTimeout>;
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
      this.loadDynamicOptions(initialValues);

      if (!this.initialized) {
        this.initialized = true;
        if (this.hasAnyFilterValue(initialValues)) {
          queueMicrotask(() => this.emitSearch(this.appliedValues()));
        }
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
      this.loadDynamicOptions(nextValues);
    }
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
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
    this.scheduleSearch();
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

  onDrawerVisibleChange(visible: boolean): void {
    if (visible) {
      this.drawerOpen.set(true);
      return;
    }

    this.closeDrawer();
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
    this.clearScheduledSearch();
    const defaults = this.buildDefaultValues();
    this.draftValues.set(defaults);
    this.appliedValues.set(this.cloneValue(defaults));
    this.searchValue.set(this.getPrimaryFieldValue(defaults));
    this.syncQueryParams(defaults);
    this.reset.emit();
    this.drawerOpen.set(false);
  }

  onFieldChange(field: TableFilterField, value: any): void {
    const normalizedValue = this.normalizeFieldValue(field, value);
    const nextValues = {
      ...this.draftValues(),
      [field.field]: normalizedValue
    };
    this.fields
      .filter((candidate) => candidate.dependsOn?.includes(field.field))
      .forEach((candidate) => {
        nextValues[candidate.field] = this.getDefaultValue(candidate);
      });

    this.draftValues.set(nextValues);
    if (this.primaryFieldConfig?.field === field.field) {
      this.searchValue.set(String(normalizedValue ?? ''));
    }
    this.loadDynamicOptions(nextValues);
  }

  valueOf(field: TableFilterField): any {
    return this.draftValues()[field.field];
  }

  optionsOf(field: TableFilterField): TableFilterOption[] {
    const state = this.optionState()[field.field];
    if (state) {
      return state.options;
    }

    if (field.optionsExpression) {
      const evaluated = this.expressionEngine.evaluate(field.optionsExpression, {
        model: this.draftValues(),
        context: { values: this.draftValues(), field },
        value: this.valueOf(field)
      });
      if (Array.isArray(evaluated)) {
        return evaluated as TableFilterOption[];
      }
    }

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

  visibleAdvancedFields(): TableFilterField[] {
    return this.fields.filter((field) => this.isFieldVisible(field));
  }

  isFieldVisible(field: TableFilterField): boolean {
    if (field.hidden) {
      return false;
    }
    return this.evaluateRule(field.rules?.visible, field, true) !== false;
  }

  isFieldDisabled(field: TableFilterField): boolean {
    const missingDependency = (field.dependsOn ?? []).some((dependency) => !this.hasValue(this.draftValues()[dependency]));
    return missingDependency || this.optionState()[field.field]?.loading === true || this.evaluateRule(field.rules?.disabled, field, false) === true;
  }

  optionLoading(field: TableFilterField): boolean {
    return this.optionState()[field.field]?.loading ?? field.loading === true;
  }

  optionError(field: TableFilterField): string | null {
    return this.optionState()[field.field]?.error ?? field.error ?? null;
  }

  retryLoadOptions(field: TableFilterField): void {
    this.loadDynamicOptions(this.draftValues(), field);
  }

  activeFilterCount(): number {
    return Object.values(this.appliedValues()).filter((value) => this.hasValue(value)).length;
  }

  activeFilterChips(): TableFilterChip[] {
    const values = this.appliedValues();

    return this.fields.reduce<TableFilterChip[]>((chips, field) => {
      const value = values[field.field];

      if (!this.hasValue(value)) {
        return chips;
      }

      chips.push({
        field,
        label: field.label,
        valueLabel: this.formatChipValue(field, value)
      });

      return chips;
    }, []);
  }

  removeFilter(field: TableFilterField): void {
    const nextValues = {
      ...this.appliedValues(),
      [field.field]: this.getDefaultValue(field)
    };

    this.appliedValues.set(nextValues);
    this.draftValues.set(this.cloneValue(nextValues));
    this.searchValue.set(this.getPrimaryFieldValue(nextValues));
    this.syncQueryParams(nextValues);
    this.emitSearch(nextValues);
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
      if (field.type === 'date-range' || field.type === 'number-range') {
        const startKey = field.queryParamStart ?? `${field.field}From`;
        const endKey = field.queryParamEnd ?? `${field.field}To`;
        acc[field.field] = {
          start: this.parseRangeQueryValue(field, params.get(startKey)),
          end: this.parseRangeQueryValue(field, params.get(endKey))
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
      case 'number-range':
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

    if (field.type === 'number-range') {
      return {
        start: this.parseNumberValue(value?.start),
        end: this.parseNumberValue(value?.end)
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

      if (field.type === 'date-range' || field.type === 'number-range') {
        acc[field.queryParamStart ?? `${field.field}From`] = this.hasValue(value?.start) ? value.start : null;
        acc[field.queryParamEnd ?? `${field.field}To`] = this.hasValue(value?.end) ? value.end : null;
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

      if (field.type === 'date-range' || field.type === 'number-range') {
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

  private hasAnyFilterValue(values: Record<string, any>): boolean {
    return Object.values(values).some((value) => this.hasValue(value));
  }

  private formatChipValue(field: TableFilterField, value: any): string {
    if (Array.isArray(value)) {
      return value.map((item) => this.optionLabelFor(field, item)).join(', ');
    }

    if (field.type === 'boolean') {
      if (value === true) {
        return 'yes';
      }
      if (value === false) {
        return 'no';
      }
    }

    if (field.type === 'date-range' || field.type === 'number-range') {
      const start = this.formatPrimitiveValue(value?.start);
      const end = this.formatPrimitiveValue(value?.end);

      return [start, end].filter(Boolean).join(' - ');
    }

    return this.optionLabelFor(field, value);
  }

  private optionLabelFor(field: TableFilterField, value: any): string {
    const option = this.optionsOf(field).find((item) => item.value === value);
    return option?.label ?? this.formatPrimitiveValue(value);
  }

  private formatPrimitiveValue(value: any): string {
    if (value == null) {
      return '';
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    return String(value);
  }

  private get enableUrlSync(): boolean {
    return this.options.enableUrlSync !== false;
  }

  private loadDynamicOptions(values: Record<string, any>, targetField?: TableFilterField): void {
    const fields = targetField ? [targetField] : this.fields;
    fields
      .filter((field) => !!field.optionsLoader)
      .forEach((field) => this.loadOptionsForField(field, values));
  }

  private loadOptionsForField(field: TableFilterField, values: Record<string, any>): void {
    if (!field.optionsLoader) {
      return;
    }
    if ((field.dependsOn ?? []).some((dependency) => !this.hasValue(values[dependency]))) {
      this.setOptionState(field.field, { options: [], loading: false, error: null });
      return;
    }

    const version = (this.optionLoadVersion.get(field.field) ?? 0) + 1;
    this.optionLoadVersion.set(field.field, version);
    this.setOptionState(field.field, { options: this.optionsOf(field), loading: true, error: null });

    let result;
    try {
      result = field.optionsLoader({ values, field });
    } catch {
      this.setOptionState(field.field, { options: [], loading: false, error: 'shared.filter.optionsLoadFailed' });
      return;
    }

    const result$ = isObservable(result) ? result : result instanceof Promise ? from(result) : of(result);
    result$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (options) => {
        if (this.optionLoadVersion.get(field.field) !== version) {
          return;
        }
        this.setOptionState(field.field, { options: options ?? [], loading: false, error: null });
      },
      error: () => {
        if (this.optionLoadVersion.get(field.field) !== version) {
          return;
        }
        this.setOptionState(field.field, { options: [], loading: false, error: 'shared.filter.optionsLoadFailed' });
      }
    });
  }

  private setOptionState(field: string, state: { options: TableFilterOption[]; loading: boolean; error: string | null }): void {
    this.optionState.update((current) => ({ ...current, [field]: state }));
  }

  private evaluateRule(expression: string | undefined, field: TableFilterField, fallback: boolean): boolean {
    if (!expression) {
      return fallback;
    }
    const result = this.expressionEngine.evaluate(expression, {
      model: this.draftValues(),
      context: { values: this.draftValues(), field },
      value: this.valueOf(field)
    });
    return typeof result === 'boolean' ? result : fallback;
  }

  private scheduleSearch(): void {
    this.clearScheduledSearch();
    const delay = Math.max(0, this.searchDebounceMs);
    this.searchTimer = setTimeout(() => this.onSearch(), delay);
  }

  private clearScheduledSearch(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = undefined;
    }
  }

  private parseNumberValue(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parseRangeQueryValue(field: TableFilterField, value: string | null): string | number {
    if (value == null) {
      return '';
    }

    return field.type === 'number-range' ? this.parseNumberValue(value) ?? '' : value;
  }

  private cloneValue<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }
}
