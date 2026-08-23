import type { OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { from, isObservable, of, Subject, takeUntil } from 'rxjs';
import type {
  TableFilterField,
  TableFilterOption,
  TableFilterOptions,
  TableFilterValue,
} from '../../../models/table-config.model';
import { ExpressionEngine } from '@shared/ui/patterns/form-input/utils/expression.engine';

interface TableFilterChip {
  field: TableFilterField;
  label: string;
  valueLabel: string;
}

interface TableFilterValidationError {
  field: string;
  message: string;
}

type PrimitiveSelectValue = string | number | boolean | null;

@Component({
  selector: 'app-table-filter',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './table-filter.html',
  styleUrls: ['./table-filter.css'],
})
export class TableFilterComponent implements OnChanges, OnDestroy {
  @Input() fields: TableFilterField[] = [];
  @Input() options: TableFilterOptions = {};
  @Input() value: TableFilterValue = {};
  @Input() loading = false;
  @Input() searchDebounceMs = 250;

  @Output() valueChange = new EventEmitter<TableFilterValue>();
  @Output() search = new EventEmitter<TableFilterValue>();
  @Output() reset = new EventEmitter<void>();

  readonly searchValue = signal('');
  readonly draftValues = signal<TableFilterValue>({});
  readonly appliedValues = signal<TableFilterValue>({});
  readonly drawerOpen = signal(false);
  readonly optionState = signal<
    Record<string, { options: TableFilterOption[]; loading: boolean; error: string | null }>
  >({});
  readonly validationErrors = signal<TableFilterValidationError[]>([]);

  private readonly destroy$ = new Subject<void>();
  private readonly expressionEngine = new ExpressionEngine();
  private readonly optionLoadVersion = new Map<string, number>();
  private searchTimer?: ReturnType<typeof setTimeout>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields'] || changes['options'] || changes['value']) {
      this.syncControlledValue();
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
      [primaryField.field]: nextValue,
    }));
    this.scheduleSearch();
  }

  onSearch(): void {
    const primaryField = this.primaryFieldConfig;
    const nextApplied = this.cloneValue(this.appliedValues());

    if (primaryField) {
      nextApplied[primaryField.field] = this.normalizedSearchValue;
    }

    if (!this.validateValues(nextApplied)) {
      return;
    }

    this.appliedValues.set(nextApplied);
    this.draftValues.update((current) => ({
      ...current,
      ...(primaryField ? { [primaryField.field]: this.normalizedSearchValue } : {}),
    }));
    this.emitSearch(nextApplied);
  }

  openDrawer(): void {
    this.draftValues.set(this.cloneValue(this.appliedValues()));
    this.drawerOpen.set(true);
  }

  toggleDrawer(): void {
    if (this.drawerOpen()) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
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
    if (!this.validateValues(nextApplied)) {
      return;
    }

    this.appliedValues.set(nextApplied);
    this.searchValue.set(this.getPrimaryFieldValue(nextApplied));
    this.emitSearch(nextApplied);
    this.drawerOpen.set(false);
  }

  onReset(): void {
    this.clearScheduledSearch();
    this.validationErrors.set([]);
    const defaults = this.buildDefaultValues();
    this.draftValues.set(defaults);
    this.appliedValues.set(this.cloneValue(defaults));
    this.searchValue.set(this.getPrimaryFieldValue(defaults));
    this.emitValueChange(defaults);
    this.reset.emit();
    this.drawerOpen.set(false);
  }

  onFieldChange(field: TableFilterField, value: unknown): void {
    const normalizedValue = this.normalizeFieldValue(field, value);
    const nextValues = {
      ...this.draftValues(),
      [field.field]: normalizedValue,
    };
    this.fields
      .filter((candidate) => candidate.dependsOn?.includes(field.field))
      .forEach((candidate) => {
        nextValues[candidate.field] = this.getDefaultValue(candidate);
      });

    this.draftValues.set(nextValues);
    if (this.validationErrors().length > 0) {
      this.validateValues(nextValues);
    }
    if (this.primaryFieldConfig?.field === field.field) {
      this.searchValue.set(String(normalizedValue ?? ''));
    }
    this.loadDynamicOptions(nextValues);
  }

  valueOf(field: TableFilterField): unknown {
    return this.draftValues()[field.field];
  }

  selectValueOf(field: TableFilterField): PrimitiveSelectValue {
    const value = this.valueOf(field);
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
      ? value
      : null;
  }

  multiValueOf(field: TableFilterField): Array<string | number> | null {
    const value = this.valueOf(field);
    return Array.isArray(value)
      ? value.filter(
          (item): item is string | number => typeof item === 'string' || typeof item === 'number',
        )
      : [];
  }

  textValueOf(field: TableFilterField): string | null {
    const value = this.valueOf(field);
    return value == null ? null : String(value);
  }

  dateValueOf(field: TableFilterField): Date | Date[] | null {
    return this.toDatePickerValue(this.valueOf(field));
  }

  dateRangeStartValue(field: TableFilterField): Date | Date[] | null {
    return this.toDatePickerValue(this.asRangeValue(this.valueOf(field)).start);
  }

  dateRangeEndValue(field: TableFilterField): Date | Date[] | null {
    return this.toDatePickerValue(this.asRangeValue(this.valueOf(field)).end);
  }

  numberRangeStartValue(field: TableFilterField): number | null {
    return this.toNumberValue(this.asRangeValue(this.valueOf(field)).start);
  }

  numberRangeEndValue(field: TableFilterField): number | null {
    return this.toNumberValue(this.asRangeValue(this.valueOf(field)).end);
  }

  onRangeFieldChange(field: TableFilterField, key: 'start' | 'end', value: unknown): void {
    this.onFieldChange(field, { ...this.asRangeValue(this.valueOf(field)), [key]: value });
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
        value: this.valueOf(field),
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
        { label: 'no', value: false },
      ];
    }

    return [];
  }

  visibleAdvancedFields(): TableFilterField[] {
    return this.fields.filter((field) => this.isFieldVisible(field));
  }

  filterFieldId(field: TableFilterField): string {
    return `table-filter-${field.field.replace(/[^A-Za-z0-9_-]+/g, '-')}`;
  }

  isFieldVisible(field: TableFilterField): boolean {
    if (field.hidden) {
      return false;
    }
    return this.evaluateRule(field.rules?.visible, field, true) !== false;
  }

  isFieldDisabled(field: TableFilterField): boolean {
    const missingDependency = (field.dependsOn ?? []).some(
      (dependency) => !this.hasValue(this.draftValues()[dependency]),
    );
    return (
      missingDependency ||
      this.optionState()[field.field]?.loading === true ||
      this.evaluateRule(field.rules?.disabled, field, false) === true
    );
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

  fieldErrors(field: TableFilterField): TableFilterValidationError[] {
    return this.validationErrors().filter((error) => error.field === field.field);
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
        valueLabel: this.formatChipValue(field, value),
      });

      return chips;
    }, []);
  }

  removeFilter(field: TableFilterField): void {
    const nextValues = {
      ...this.appliedValues(),
      [field.field]: this.getDefaultValue(field),
    };

    this.appliedValues.set(nextValues);
    this.draftValues.set(this.cloneValue(nextValues));
    this.validationErrors.set(
      this.validationErrors().filter((error) => error.field !== field.field),
    );
    this.searchValue.set(this.getPrimaryFieldValue(nextValues));
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

  private syncControlledValue(): void {
    const nextValues = this.buildValuesFromInput(this.value ?? {});
    this.draftValues.set(this.cloneValue(nextValues));
    this.appliedValues.set(this.cloneValue(nextValues));
    this.searchValue.set(this.getPrimaryFieldValue(nextValues));
    this.loadDynamicOptions(nextValues);
  }

  private buildValuesFromInput(input: TableFilterValue): TableFilterValue {
    const defaults = this.buildDefaultValues();

    return this.fields.reduce<TableFilterValue>(
      (acc, field) => {
        if (field.type === 'date-range' || field.type === 'number-range') {
          const fieldValue = input[field.field];
          const rangeValue = this.asRangeValue(fieldValue);
          const defaultRange = this.asRangeValue(defaults[field.field]);
          acc[field.field] = {
            start: this.parseRangeInputValue(
              field,
              this.inputValueOrDefault(rangeValue, 'start', defaultRange.start),
            ),
            end: this.parseRangeInputValue(
              field,
              this.inputValueOrDefault(rangeValue, 'end', defaultRange.end),
            ),
          };
          return acc;
        }

        const raw = input[field.field];
        if (raw === undefined) {
          acc[field.field] = defaults[field.field];
          return acc;
        }

        acc[field.field] = this.parseInputValue(field, raw);
        return acc;
      },
      { ...defaults },
    );
  }

  private buildDefaultValues(): TableFilterValue {
    return this.fields.reduce<TableFilterValue>((acc, field) => {
      acc[field.field] = this.getDefaultValue(field);
      return acc;
    }, {});
  }

  private getDefaultValue(field: TableFilterField): unknown {
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

  private getPrimaryFieldValue(values: TableFilterValue): string {
    const primaryField = this.primaryFieldConfig;
    const value = primaryField ? values[primaryField.field] : '';
    return String(value ?? '');
  }

  private normalizeFieldValue(field: TableFilterField, value: unknown): unknown {
    if (field.type === 'multi-select') {
      return Array.isArray(value) ? value : [];
    }

    if (field.type === 'date-range') {
      return {
        start: this.asRangeValue(value).start ?? '',
        end: this.asRangeValue(value).end ?? '',
      };
    }

    if (field.type === 'number-range') {
      return {
        start: this.parseNumberValue(this.asRangeValue(value).start),
        end: this.parseNumberValue(this.asRangeValue(value).end),
      };
    }

    return value;
  }

  private parseInputValue(field: TableFilterField, raw: unknown): unknown {
    if (field.type === 'multi-select') {
      return Array.isArray(raw) ? raw : String(raw).split(',').filter(Boolean);
    }

    if (field.type === 'boolean') {
      if (typeof raw === 'boolean') return raw;
      if (raw === 'true') return true;
      if (raw === 'false') return false;
      return null;
    }

    return raw;
  }

  private emitSearch(values: TableFilterValue): void {
    const payload = this.normalizePayload(values);
    this.valueChange.emit(payload);
    this.search.emit(payload);
  }

  private emitValueChange(values: TableFilterValue): void {
    this.valueChange.emit(this.normalizePayload(values));
  }

  private validateValues(values: TableFilterValue): boolean {
    const errors = this.fields
      .filter((field) => this.isFieldVisible(field))
      .flatMap((field) => this.validateField(field, values));
    this.validationErrors.set(errors);
    return errors.length === 0;
  }

  private validateField(
    field: TableFilterField,
    values: TableFilterValue,
  ): TableFilterValidationError[] {
    const value = values[field.field];
    const errors: TableFilterValidationError[] = [];

    const rangeValue = this.asRangeValue(value);

    if (
      field.type === 'date-range' &&
      this.hasValue(rangeValue.start) &&
      this.hasValue(rangeValue.end)
    ) {
      const start = new Date(String(rangeValue.start)).getTime();
      const end = new Date(String(rangeValue.end)).getTime();
      if (Number.isFinite(start) && Number.isFinite(end) && start > end) {
        errors.push({ field: field.field, message: 'shared.filter.dateRangeInvalid' });
      }
    }

    if (
      field.type === 'number-range' &&
      this.hasValue(rangeValue.start) &&
      this.hasValue(rangeValue.end) &&
      Number(rangeValue.start) > Number(rangeValue.end)
    ) {
      errors.push({ field: field.field, message: 'shared.filter.numberRangeInvalid' });
    }

    (field.validation ?? []).forEach((rule) => {
      if (this.isValidationRuleFailed(rule, field, value, values)) {
        errors.push({ field: field.field, message: rule.message });
      }
    });

    return errors;
  }

  private isValidationRuleFailed(
    rule: NonNullable<TableFilterField['validation']>[number],
    field: TableFilterField,
    value: unknown,
    values: TableFilterValue,
  ): boolean {
    if (rule.type === 'required') {
      return !this.hasValue(value);
    }

    if (rule.type === 'min' && rule.value != null && this.hasValue(value)) {
      return Number(value) < Number(rule.value);
    }

    if (rule.type === 'max' && rule.value != null && this.hasValue(value)) {
      return Number(value) > Number(rule.value);
    }

    if (rule.type === 'regex' && rule.value != null && typeof value === 'string') {
      try {
        return !new RegExp(String(rule.value)).test(value);
      } catch {
        return false;
      }
    }

    if (!rule.expression) {
      return false;
    }

    try {
      const result = this.expressionEngine.evaluate(rule.expression, {
        model: values,
        context: { values, field },
        value,
      });
      return result === true;
    } catch {
      return false;
    }
  }

  private normalizePayload(values: TableFilterValue): TableFilterValue {
    return this.fields.reduce<TableFilterValue>((acc, field) => {
      const value = values[field.field];

      if (field.type === 'date-range' || field.type === 'number-range') {
        const rangeValueInput = this.asRangeValue(value);
        const rangeValue: Record<string, unknown> = {};
        if (this.hasValue(rangeValueInput.start)) {
          rangeValue['start'] = rangeValueInput.start;
        }
        if (this.hasValue(rangeValueInput.end)) {
          rangeValue['end'] = rangeValueInput.end;
        }
        if (this.hasValue(rangeValue)) {
          acc[field.field] = rangeValue;
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

  private hasValue(value: unknown): boolean {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (value && typeof value === 'object') {
      return Object.values(value).some((item) => this.hasValue(item));
    }

    return value !== null && value !== undefined && value !== '';
  }

  private asRangeValue(value: unknown): { start?: unknown; end?: unknown } {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as { start?: unknown; end?: unknown })
      : {};
  }

  private formatChipValue(field: TableFilterField, value: unknown): string {
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
      const rangeValue = this.asRangeValue(value);
      const start = this.formatPrimitiveValue(rangeValue.start);
      const end = this.formatPrimitiveValue(rangeValue.end);

      return [start, end].filter(Boolean).join(' - ');
    }

    return this.optionLabelFor(field, value);
  }

  private optionLabelFor(field: TableFilterField, value: unknown): string {
    const option = this.optionsOf(field).find((item) => item.value === value);
    return option?.label ?? this.formatPrimitiveValue(value);
  }

  private formatPrimitiveValue(value: unknown): string {
    if (value == null) {
      return '';
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    return String(value);
  }

  private toDatePickerValue(value: unknown): Date | Date[] | null {
    if (value instanceof Date || value === null) {
      return value;
    }
    if (Array.isArray(value) && value.every((item) => item instanceof Date || item === null)) {
      return value as Date[];
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  private toNumberValue(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private loadDynamicOptions(values: TableFilterValue, targetField?: TableFilterField): void {
    const fields = targetField ? [targetField] : this.fields;
    fields
      .filter((field) => !!field.optionsLoader)
      .forEach((field) => this.loadOptionsForField(field, values));
  }

  private loadOptionsForField(field: TableFilterField, values: TableFilterValue): void {
    if (!field.optionsLoader) {
      return;
    }
    if ((field.dependsOn ?? []).some((dependency) => !this.hasValue(values[dependency]))) {
      this.setOptionState(field.field, { options: [], loading: false, error: null });
      return;
    }

    const version = (this.optionLoadVersion.get(field.field) ?? 0) + 1;
    this.optionLoadVersion.set(field.field, version);
    this.setOptionState(field.field, {
      options: this.optionsOf(field),
      loading: true,
      error: null,
    });

    let result;
    try {
      result = field.optionsLoader({ values, field });
    } catch {
      this.setOptionState(field.field, {
        options: [],
        loading: false,
        error: 'shared.filter.optionsLoadFailed',
      });
      return;
    }

    const result$ = isObservable(result)
      ? result
      : result instanceof Promise
        ? from(result)
        : of(result);
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
        this.setOptionState(field.field, {
          options: [],
          loading: false,
          error: 'shared.filter.optionsLoadFailed',
        });
      },
    });
  }

  private setOptionState(
    field: string,
    state: { options: TableFilterOption[]; loading: boolean; error: string | null },
  ): void {
    this.optionState.update((current) => ({ ...current, [field]: state }));
  }

  private evaluateRule(
    expression: string | undefined,
    field: TableFilterField,
    fallback: boolean,
  ): boolean {
    if (!expression) {
      return fallback;
    }
    const result = this.expressionEngine.evaluate(expression, {
      model: this.draftValues(),
      context: { values: this.draftValues(), field },
      value: this.valueOf(field),
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

  private parseRangeInputValue(field: TableFilterField, value: unknown): string | number | null {
    if (value == null) {
      return null;
    }

    return field.type === 'number-range' ? this.parseNumberValue(value) : String(value);
  }

  private inputValueOrDefault(
    value: Record<string, unknown>,
    key: string,
    fallback: unknown,
  ): unknown {
    return Object.prototype.hasOwnProperty.call(value, key) ? value[key] : fallback;
  }

  private cloneValue<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}
