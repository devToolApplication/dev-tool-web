import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  computed,
  signal
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isObservable, Subject, takeUntil } from 'rxjs';
import { ExpressionEngine } from '../../../form-input/utils/expression.engine';
import {
  TableFilterContext,
  TableFilterField,
  TableFilterOption,
  TableFilterOptions
} from '../../models/table-config.model';

interface ActiveFilterChip {
  field: string;
  label: string;
  value: string;
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

  @Output() search = new EventEmitter<Record<string, any>>();
  @Output() reset = new EventEmitter<void>();

  readonly draftValues = signal<Record<string, any>>({});
  readonly appliedValues = signal<Record<string, any>>({});
  readonly fieldOptionsMap = signal<Record<string, TableFilterOption[]>>({});
  readonly loadingOptionsMap = signal<Record<string, boolean>>({});
  readonly errorsMap = signal<Record<string, string | null>>({});
  readonly drawerOpen = signal(false);
  readonly drawerSnapshot = signal<Record<string, any>>({});

  private readonly destroy$ = new Subject<void>();
  private readonly expr = new ExpressionEngine();
  private initialized = false;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  readonly visibleFields = computed(() => this.fields.filter((field) => this.isFieldVisible(field)));

  readonly quickFields = computed(() => this.visibleFields().filter((field) => field.quick !== false));

  readonly advancedFields = computed(() => this.visibleFields());

  readonly activeChips = computed<ActiveFilterChip[]>(() =>
    this.visibleFields().flatMap((field) => this.createChipsForField(field, this.draftValues()[field.field]))
  );

  readonly hasValidationErrors = computed(() =>
    Object.values(this.errorsMap()).some((error) => Boolean(error))
  );

  readonly hasDraftChanges = computed(() =>
    JSON.stringify(this.normalizePayload(this.draftValues())) !== JSON.stringify(this.normalizePayload(this.appliedValues()))
  );

  readonly canApply = computed(() => this.hasDraftChanges() && !this.hasValidationErrors() && !this.loading);

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (!this.fields.length) {
        return;
      }

      const merged = this.buildInitialValues(params);
      this.draftValues.set(merged);
      this.appliedValues.set(this.cloneValue(merged));
      this.drawerSnapshot.set(this.cloneValue(merged));
      this.refreshFieldOptions();
      this.validateAll();

      if (!this.initialized) {
        this.initialized = true;
        queueMicrotask(() => this.emitSearch(this.appliedValues()));
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields'] || changes['options']) {
      this.refreshFieldOptions();
      this.validateAll();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.drawerOpen()) {
      this.onCancelDrawer();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    if (!target.closest('.filter-drawer') && !target.closest('.filter-trigger')) {
      return;
    }
  }

  valueOf(fieldKey: string): any {
    return this.draftValues()[fieldKey];
  }

  optionsOf(fieldKey: string): TableFilterOption[] {
    return this.fieldOptionsMap()[fieldKey] ?? [];
  }

  errorOf(fieldKey: string): string | null {
    return this.errorsMap()[fieldKey] ?? null;
  }

  isFieldLoading(fieldKey: string): boolean {
    return this.loadingOptionsMap()[fieldKey] === true;
  }

  isFieldDisabled(field: TableFilterField): boolean {
    if (field.rules?.disabled) {
      return !!this.expr.evaluate(field.rules.disabled, this.buildExpressionContext(field));
    }

    return false;
  }

  onValueChange(field: TableFilterField, value: any): void {
    const next = {
      ...this.draftValues(),
      [field.field]: this.normalizeFieldValue(field, value)
    };

    this.draftValues.set(next);
    this.handleDependencies(field, next);
    this.refreshFieldOptions();
    this.validateAll();
  }

  onRemoveChip(fieldKey: string): void {
    const field = this.fields.find((item) => item.field === fieldKey);
    if (!field) {
      return;
    }

    this.onValueChange(field, this.getDefaultValue(field));
  }

  onApply(): void {
    if (!this.canApply()) {
      return;
    }

    const normalized = this.normalizePayload(this.draftValues());
    this.appliedValues.set(this.cloneValue(this.draftValues()));
    this.drawerSnapshot.set(this.cloneValue(this.draftValues()));

    if (this.enableUrlSync) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: this.serializeToQueryParams(this.draftValues()),
        queryParamsHandling: ''
      });
    }

    this.emitSearch(normalized);
    if (this.drawerOpen()) {
      this.drawerOpen.set(false);
    }
  }

  onResetToDefaults(): void {
    const defaults = this.buildDefaultValues();
    this.draftValues.set(defaults);
    this.refreshFieldOptions();
    this.validateAll();
    this.reset.emit();
  }

  openDrawer(): void {
    this.drawerSnapshot.set(this.cloneValue(this.draftValues()));
    this.drawerOpen.set(true);
  }

  onCancelDrawer(): void {
    this.draftValues.set(this.cloneValue(this.drawerSnapshot()));
    this.refreshFieldOptions();
    this.validateAll();
    this.drawerOpen.set(false);
  }

  trackField(_: number, field: TableFilterField): string {
    return field.field;
  }

  private emitSearch(values: Record<string, any>): void {
    this.search.emit(this.normalizePayload(values));
  }

  private buildInitialValues(params: import('@angular/router').ParamMap): Record<string, any> {
    const defaults = this.buildDefaultValues();

    return this.fields.reduce<Record<string, any>>((acc, field) => {
      if (field.type === 'date-range') {
        const startKey = field.queryParamStart ?? `${field.field}From`;
        const endKey = field.queryParamEnd ?? `${field.field}To`;
        const start = params.get(startKey);
        const end = params.get(endKey);
        acc[field.field] = start || end ? { start: start ?? '', end: end ?? '' } : defaults[field.field];
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

  private serializeToQueryParams(values: Record<string, any>): Record<string, any> {
    return this.fields.reduce<Record<string, any>>((acc, field) => {
      const value = values[field.field];

      if (field.type === 'date-range') {
        const startKey = field.queryParamStart ?? `${field.field}From`;
        const endKey = field.queryParamEnd ?? `${field.field}To`;
        acc[startKey] = value?.start || null;
        acc[endKey] = value?.end || null;
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
        if (value.length > 0) {
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

  private createChipsForField(field: TableFilterField, value: any): ActiveFilterChip[] {
    if (!this.hasValue(value)) {
      return [];
    }

    if (field.type === 'multi-select' && Array.isArray(value) && value.length) {
      return [{ field: field.field, label: field.label, value: value.join(', ') }];
    }

    if (field.type === 'date-range' && (value?.start || value?.end)) {
      const start = value?.start || '—';
      const end = value?.end || '—';
      return [{ field: field.field, label: field.label, value: `${start} → ${end}` }];
    }

    return [{ field: field.field, label: field.label, value: String(value) }];
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

  private validateAll(): void {
    const result: Record<string, string | null> = {};
    for (const field of this.visibleFields()) {
      result[field.field] = this.validateField(field);
    }
    this.errorsMap.set(result);
  }

  private validateField(field: TableFilterField): string | null {
    const value = this.draftValues()[field.field];
    for (const rule of field.validation ?? []) {
      const invalid = this.expr.evaluate(rule.expression, this.buildExpressionContext(field, value));
      if (invalid) {
        return this.expr.renderTemplate(rule.message, this.buildExpressionContext(field, value));
      }
    }

    return null;
  }

  private isFieldVisible(field: TableFilterField): boolean {
    if (field.hidden) {
      return false;
    }

    if (!field.rules?.visible) {
      return true;
    }

    return !!this.expr.evaluate(field.rules.visible, this.buildExpressionContext(field));
  }

  private buildExpressionContext(field: TableFilterField, value = this.draftValues()[field.field]): TableFilterContext & {
    model: Record<string, any>;
    context: Record<string, any>;
    value: any;
  } {
    return {
      values: this.draftValues(),
      field,
      model: this.draftValues(),
      context: { appliedValues: this.appliedValues() },
      value
    };
  }

  private refreshFieldOptions(): void {
    for (const field of this.fields) {
      void this.loadOptionsForField(field);
    }
  }

  private async loadOptionsForField(field: TableFilterField): Promise<void> {
    const context = this.buildExpressionContext(field);

    if (field.optionsExpression) {
      const evaluated = this.expr.evaluate(field.optionsExpression, context) ?? [];
      this.patchOptions(field.field, Array.isArray(evaluated) ? evaluated : []);
      return;
    }

    if (!field.optionsLoader) {
      this.patchOptions(field.field, field.options ?? []);
      return;
    }

    this.patchLoading(field.field, true);

    try {
      const response = field.optionsLoader(context);
      if (isObservable(response)) {
        response.pipe(takeUntil(this.destroy$)).subscribe((options) => {
          this.patchOptions(field.field, options ?? []);
          this.patchLoading(field.field, false);
        });
        return;
      }

      const options = await response;
      this.patchOptions(field.field, options ?? []);
    } catch {
      this.patchOptions(field.field, []);
    } finally {
      this.patchLoading(field.field, false);
    }
  }

  private patchOptions(fieldKey: string, options: TableFilterOption[]): void {
    this.fieldOptionsMap.update((current) => ({ ...current, [fieldKey]: options }));
  }

  private patchLoading(fieldKey: string, loading: boolean): void {
    this.loadingOptionsMap.update((current) => ({ ...current, [fieldKey]: loading }));
  }

  private handleDependencies(field: TableFilterField, nextValues: Record<string, any>): void {
    const dependents = this.fields.filter((candidate) => candidate.dependsOn?.includes(field.field));
    if (!dependents.length) {
      return;
    }

    const cloned = { ...nextValues };
    for (const dependent of dependents) {
      cloned[dependent.field] = this.getDefaultValue(dependent);
    }
    this.draftValues.set(cloned);
  }

  private get enableUrlSync(): boolean {
    return this.options.enableUrlSync !== false;
  }

  private cloneValue<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }
}
