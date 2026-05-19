import { Component, computed, DoCheck, effect, EventEmitter, Injector, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import {createFormEngine} from './utils/form-engine';
import {
  ArrayFieldState,
  FieldState,
  FormConfig,
  FormLayoutConfig,
  FormContext,
  FormValidationError,
  GridWidth,
  GroupFieldState,
  TreeFieldState
} from './models/form-config.model';
import { getColClass } from './utils/form.utils';
import { ValidationSummaryItem } from '../forms/validation-summary/validation-summary.component';
import {
  buildFormSections,
  fieldErrorEntries,
  flattenFormFields,
  FormRenderableField
} from './utils/form-sections';

@Component({
  selector: 'app-form-input',
  standalone: false,
  templateUrl: './form-input.html',
  styleUrl: './form-input.css',
})
export class FormInput implements OnInit, OnChanges, DoCheck {
  private suppressValueChange = true;
  private readonly engineRevision = signal(0);
  private readonly inputRevision = signal(0);
  private lastContextRef: FormContext | null = null;
  private lastContextSignature = '';

  constructor(private readonly injector: Injector) {}

  @Input() config!: FormConfig;
  @Input() context!: FormContext;
  @Input() initialValue!: any;
  @Input() submitting = false;
  @Input() loading = false;
  @Input() apiError?: string | null;
  @Input() apiFieldErrors?: Record<string, string | string[]> | FormValidationError[] | null;
  @Input() showSubmit = true;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() valueChange = new EventEmitter<any>();
  @Output() validChange = new EventEmitter<boolean>();

  engine: any;
  readonly submitted = signal(false);
  readonly activeSectionId = signal<string | null>(null);

  readonly layout = computed<FormLayoutConfig>(() => ({
    ...this.trackConfigRevision(),
    mode: 'smart',
    density: 'comfortable',
    labelPlacement: 'top',
    sectionNavigation: 'sidebar',
    showStatusPanel: true,
    stickyFooter: true,
    autoScrollToError: true,
    showValidationSummary: true,
    readonlyMode: 'detail',
    ...(this.config?.layout ?? {})
  }));

  readonly renderSections = computed(() => {
    this.engineRevision();
    if (!this.engine) {
      return [];
    }

    return buildFormSections(this.config, this.engine.fields as FormRenderableField[], {
      activeSectionId: this.activeSectionId(),
      submitted: this.submitted()
    });
  });

  private readonly flatFields = computed<FieldState[]>(() => {
    this.engineRevision();
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
          title: section.title
        })
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
        severity: error.severity
      }))
    );
  });

  readonly dirty = computed(() => {
    return this.flatFields().some((field) => field.dirty());
  });

  readonly errorCount = computed(() =>
    this.validationSummaryItems().filter((item) => (item.severity ?? 'error') === 'error').length
  );

  readonly warningCount = computed(() =>
    this.validationSummaryItems().filter((item) => item.severity === 'warning').length
  );

  readonly readonlyMode = computed(() =>
    (this.engine?.context?.()?.mode ?? this.context?.mode) === 'view' &&
    this.layout().readonlyMode !== 'disabled-controls'
  );

  readonly submitDisabled = computed(() => {
    this.engineRevision();
    this.inputRevision();
    const actions = this.config?.actions;
    if (this.loading || this.submitting || this.readonlyMode() || actions?.submitDisabled) {
      return true;
    }
    return actions?.disableSubmitWhenInvalid === true && !this.isValid();
  });

  ngOnInit() {
    this.rebuildEngine();

    effect(() => {
      this.engineRevision();
      if (!this.engine) {
        return;
      }
      const model = this.engine.model();
      this.validChange.emit(this.engine.valid());
      if (this.suppressValueChange) {
        this.suppressValueChange = false;
        return;
      }

      this.valueChange.emit(model);
    }, { injector: this.injector });
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
      this.syncContextInput();
    }

    if (changes['apiFieldErrors']) {
      this.applyApiFieldErrors();
    }

    if (changes['initialValue']) {
      this.suppressValueChange = true;
      this.engine.reset(this.initialValue);
    }

    if (changes['submitting'] || changes['loading'] || changes['showSubmit']) {
      this.inputRevision.update((revision) => revision + 1);
    }
  }

  ngDoCheck(): void {
    this.syncContextInput();
  }

  onSubmit() {
    if (this.submitting || this.loading || this.readonlyMode() || this.config?.actions?.submitDisabled) {
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

  getModel<TModel = any>(): TModel {
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

    const element = document.querySelector(`[data-field-path="${item.fieldPath}"]`) as HTMLElement | null;
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
    this.engineRevision.update((revision) => revision + 1);
  }

  private rebuildEngine(): void {
    this.suppressValueChange = true;
    const context = this.cloneFormContext(this.context);
    this.engine = createFormEngine(this.config, context, this.initialValue);
    this.lastContextRef = this.context;
    this.lastContextSignature = this.contextSignature(this.context);
    this.submitted.set(false);
    this.activeSectionId.set(null);
    this.engineRevision.update((revision) => revision + 1);
    this.applyApiFieldErrors();
  }

  private syncContextInput(): void {
    if (!this.engine || !this.context) {
      return;
    }

    const signature = this.contextSignature(this.context);
    if (this.context === this.lastContextRef && signature === this.lastContextSignature) {
      return;
    }

    this.lastContextRef = this.context;
    this.lastContextSignature = signature;
    this.engine.context.set(this.cloneFormContext(this.context));
    this.engineRevision.update((revision) => revision + 1);
  }

  private cloneFormContext(context: FormContext): FormContext {
    return {
      ...context,
      extra: context.extra ? { ...context.extra } : context.extra
    };
  }

  private contextSignature(context: FormContext): string {
    return this.stringifyContextValue({
      mode: context.mode,
      user: context.user,
      extra: context.extra
    });
  }

  private stringifyContextValue(value: unknown): string {
    try {
      return JSON.stringify(value, (_key, item) => (typeof item === 'function' ? `[function:${item.name || 'anonymous'}]` : item)) ?? '';
    } catch {
      return String(value ?? '');
    }
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
        [`api-${Object.keys(target.externalErrors() ?? {}).length}`]: error.message
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
        severity: 'error' as const
      }));
    });
  }

  private trackConfigRevision(): Record<string, never> {
    this.engineRevision();
    return {};
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

      const element = document.querySelector(`[data-field-path="${firstInvalid.path}"]`) as HTMLElement | null;
      if (typeof element?.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      element?.focus?.();
    });
  }
}
