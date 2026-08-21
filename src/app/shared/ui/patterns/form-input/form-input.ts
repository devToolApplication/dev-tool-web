import {
  Component,
  computed,
  effect,
  EventEmitter,
  Injector,
  Input,
  OnChanges,
  OnInit,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { createFormEngine } from './utils/form-engine';
import {
  ArrayFieldState,
  FieldState,
  FormConfig,
  FormContext,
  FormLayoutConfig,
  FormValidationError,
  GridWidth,
  GroupFieldState,
  TreeFieldState,
} from './models/form-config.model';
import { getColClass } from './utils/form.utils';
import { ValidationSummaryItem } from '@shared/ui/forms/validation-summary/validation-summary.component';
import {
  buildFormSections,
  fieldErrorEntries,
  flattenFormFields,
  FormRenderableField,
} from './utils/form-sections';

@Component({
  selector: 'app-form-input',
  standalone: false,
  templateUrl: './form-input.html',
  styleUrl: './form-input.css',
})
export class FormInput implements OnInit, OnChanges {
  private suppressValueChange = true;

  constructor(private readonly injector: Injector) {}

  @Input() config!: FormConfig;
  @Input() context: FormContext = { user: null };
  @Input() initialValue: unknown = {};
  @Input() submitting = false;
  @Input() loading = false;
  @Input() apiError?: string | null;
  @Input() apiFieldErrors?: Record<string, string | string[]> | FormValidationError[] | null;

  @Output() formSubmit = new EventEmitter<unknown>();
  @Output() valueChange = new EventEmitter<unknown>();
  @Output() dirtyChange = new EventEmitter<boolean>();
  @Output() validChange = new EventEmitter<boolean>();

  engine: any;
  readonly submitted = signal(false);
  readonly activeSectionId = signal<string | null>(null);

  readonly layout = computed<FormLayoutConfig>(() => ({
    mode: 'smart',
    density: 'comfortable',
    labelPlacement: 'top',
    sectionNavigation: 'sidebar',
    showStatusPanel: true,
    stickyFooter: true,
    autoScrollToError: true,
    showValidationSummary: true,
    readonlyMode: 'detail',
    ...(this.config?.layout ?? {}),
  }));

  readonly renderSections = computed(() => {
    if (!this.engine) {
      return [];
    }

    return buildFormSections(this.config, this.engine.fields as FormRenderableField[], {
      activeSectionId: this.activeSectionId(),
      submitted: this.submitted(),
    });
  });

  readonly firstRenderSection = computed(() => this.renderSections()[0] ?? null);
  readonly remainingRenderSections = computed(() => this.renderSections().slice(1));

  private readonly flatFields = computed<FieldState[]>(() => {
    if (!this.engine) {
      return [];
    }

    return flattenFormFields(this.engine.fields as FormRenderableField[]);
  });

  private readonly sectionByFieldPath = computed(() => {
    const sectionByField = new Map<string, { id: string; title: string }>();
    this.renderSections().forEach((section) => {
      flattenFormFields(section.fields).forEach((field) =>
        sectionByField.set(field.path, {
          id: section.id,
          title: section.title,
        }),
      );
    });
    return sectionByField;
  });

  private readonly fieldLookup = computed(() => {
    const byPath = new Map<string, FieldState>();
    const byName = new Map<string, FieldState[]>();

    this.flatFields().forEach((field) => {
      byPath.set(field.path, field);
      const namedFields = byName.get(field.name);
      if (namedFields) {
        namedFields.push(field);
        return;
      }
      byName.set(field.name, [field]);
    });

    return { byPath, byName };
  });

  readonly validationSummaryItems = computed<ValidationSummaryItem[]>(() => {
    if (!this.engine) {
      return [];
    }

    const sectionByField = this.sectionByFieldPath();

    return this.flatFields().flatMap((field) =>
      fieldErrorEntries(field, this.submitted()).map((error) => ({
        fieldPath: field.path,
        label: field.label ?? field.name,
        message: error.message,
        section: sectionByField.get(field.path)?.title,
        severity: error.severity,
      })),
    );
  });

  readonly dirty = computed(() => {
    return this.flatFields().some((field) => field.dirty());
  });

  readonly errorCount = computed(
    () =>
      this.validationSummaryItems().filter((item) => (item.severity ?? 'error') === 'error').length,
  );

  readonly warningCount = computed(
    () => this.validationSummaryItems().filter((item) => item.severity === 'warning').length,
  );

  readonly readonlyMode = computed(
    () =>
      (this.engine?.context?.()?.mode ?? this.context?.mode) === 'view' &&
      this.layout().readonlyMode !== 'disabled-controls',
  );

  readonly submitDisabled = computed(() => {
    const actions = this.config?.actions;
    if (this.loading || this.submitting || this.readonlyMode() || actions?.submitDisabled) {
      return true;
    }
    return actions?.disableSubmitWhenInvalid === true && !this.isValid();
  });

  ngOnInit(): void {
    this.rebuildEngine();

    effect(
      () => {
        if (!this.engine) {
          return;
        }
        const model = this.engine.model();
        this.validChange.emit(this.engine.valid());
        this.dirtyChange.emit(this.dirty());

        if (this.suppressValueChange) {
          this.suppressValueChange = false;
          return;
        }

        this.valueChange.emit(model);
      },
      { injector: this.injector },
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.engine) {
      return;
    }

    if (changes['config']?.currentValue) {
      this.rebuildEngine();
      return;
    }

    if (changes['context']?.currentValue) {
      this.engine.context.set({ ...this.context });
    }

    if (changes['apiFieldErrors']) {
      this.applyApiFieldErrors();
    }

    if (changes['initialValue']) {
      this.suppressValueChange = true;
      this.engine.reset(this.initialValue);
    }
  }

  showSectionNav(): boolean {
    return this.renderSections().length >= 2;
  }

  onSubmit(): void {
    if (this.submitting || this.loading || this.readonlyMode()) {
      return;
    }

    this.submitted.set(true);
    this.engine.markAllAsTouched();
    if (!this.engine.valid()) {
      this.scrollToFirstInvalidField();
      return;
    }
    this.formSubmit.emit(this.engine.model());
  }

  markAllAsTouched(): void {
    this.engine?.markAllAsTouched();
  }

  isValid(): boolean {
    return Boolean(this.engine?.valid?.());
  }

  getModel<TModel = unknown>(): TModel {
    return this.engine?.model?.() as TModel;
  }

  getCol(width?: GridWidth): string {
    return getColClass(width);
  }

  asArrayField(field: FormRenderableField): ArrayFieldState {
    return field as ArrayFieldState;
  }

  asGroupField(field: FormRenderableField): GroupFieldState {
    return field as GroupFieldState;
  }

  asTreeField(field: FormRenderableField): TreeFieldState {
    return field as TreeFieldState;
  }

  onSummaryItemClick(item: ValidationSummaryItem): void {
    if (!item.fieldPath) {
      return;
    }

    const element = document.querySelector(
      `[data-field-path="${item.fieldPath}"]`,
    ) as HTMLElement | null;
    if (typeof element?.scrollIntoView === 'function') {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    element?.focus?.();
  }

  onSectionSelect(sectionId: string): void {
    this.activeSectionId.set(sectionId);
    const element = document.getElementById(`form-section-${sectionId}`);
    if (typeof element?.scrollIntoView === 'function') {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  reviewErrors(): void {
    const first = this.validationSummaryItems()[0];
    if (first) {
      this.onSummaryItemClick(first);
      return;
    }
    this.scrollToFirstInvalidField();
  }

  isDirty(): boolean {
    return this.dirty();
  }

  resetDirtyState(): void {
    if (!this.engine) {
      return;
    }
    this.flatFields().forEach((field) => field.dirty.set(false));
  }

  resetToInitialValue(): void {
    if (!this.engine) {
      return;
    }

    this.suppressValueChange = true;
    this.engine.reset(this.initialValue);
    this.submitted.set(false);
  }

  private rebuildEngine(): void {
    this.suppressValueChange = true;
    const context = { ...this.context };
    this.engine = createFormEngine(this.config, context, (this.initialValue ?? {}) as object);
    this.submitted.set(false);
    this.activeSectionId.set(null);
    this.applyApiFieldErrors();
  }

  private applyApiFieldErrors(): void {
    if (!this.engine) {
      return;
    }

    const fields = this.flatFields();
    const lookup = this.fieldLookup();
    fields.forEach((field) => field.externalErrors.set(null));

    for (const error of this.normalizeApiFieldErrors()) {
      if (!error.fieldPath) {
        continue;
      }
      const target = lookup.byPath.get(error.fieldPath) ?? lookup.byName.get(error.fieldPath)?.[0];
      if (!target) {
        continue;
      }
      target.externalErrors.set({
        ...(target.externalErrors() ?? {}),
        [`api-${Object.keys(target.externalErrors() ?? {}).length}`]: error.message,
      });
    }
  }

  private normalizeApiFieldErrors(): FormValidationError[] {
    if (!this.apiFieldErrors) {
      return [];
    }

    if (Array.isArray(this.apiFieldErrors)) {
      return this.apiFieldErrors;
    }

    return Object.entries(this.apiFieldErrors).flatMap(([fieldPath, value]) => {
      const messages = Array.isArray(value) ? value : [value];
      return messages.map((message) => ({
        fieldPath,
        message,
        severity: 'error' as const,
      }));
    });
  }

  private scrollToFirstInvalidField(): void {
    if (this.layout().autoScrollToError === false || !this.engine) {
      return;
    }

    queueMicrotask(() => {
      const firstInvalid = this.flatFields().find((field) => field.visible() && !!field.errors());
      if (!firstInvalid) {
        return;
      }

      const targetSection = this.sectionByFieldPath().get(firstInvalid.path);
      if (targetSection) {
        this.activeSectionId.set(targetSection.id);
      }

      const element = document.querySelector(
        `[data-field-path="${firstInvalid.path}"]`,
      ) as HTMLElement | null;
      if (typeof element?.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      element?.focus?.();
    });
  }
}

