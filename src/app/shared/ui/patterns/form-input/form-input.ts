import type { OnChanges, OnInit, QueryList, SimpleChanges } from '@angular/core';
import {
  Component,
  computed,
  ElementRef,
  effect,
  EventEmitter,
  Injector,
  Input,
  Output,
  inject,
  signal,
  ViewChildren,
} from '@angular/core';
import type { FormEngineInstance } from './utils/form-engine';
import { createFormEngine } from './utils/form-engine';
import type {
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
import type { ValidationSummaryItem } from '@shared/ui/forms/validation-summary/validation-summary.component';
import type { FormRenderableField } from './utils/form-sections';
import { buildFormSections, fieldErrorEntries, flattenFormFields } from './utils/form-sections';

@Component({
  selector: 'app-form-input',
  standalone: false,
  templateUrl: './form-input.html',
  styleUrl: './form-input.css',
})
export class FormInput implements OnInit, OnChanges {
  private readonly injector = inject(Injector);
  private suppressValueChange = true;

  @ViewChildren('fieldHost', { read: ElementRef })
  private fieldHosts?: QueryList<ElementRef<HTMLElement>>;

  @ViewChildren('sectionHost', { read: ElementRef })
  private sectionHosts?: QueryList<ElementRef<HTMLElement>>;

  @Input() config!: FormConfig;
  @Input() context: FormContext = { user: null };
  @Input() initialValue: unknown = {};
  @Input() submitting = false;
  @Input() loading = false;
  @Input() formError?: string | null;
  @Input() externalErrors: FormValidationError[] = [];

  @Output() formSubmit = new EventEmitter<unknown>();
  @Output() valueChange = new EventEmitter<unknown>();
  @Output() dirtyChange = new EventEmitter<boolean>();
  @Output() validChange = new EventEmitter<boolean>();

  readonly configSignal = signal<FormConfig>({ fields: [] });
  readonly contextSignal = signal<FormContext>({ user: null });
  readonly initialValueSignal = signal<unknown>({});
  readonly loadingSignal = signal<boolean>(false);
  readonly submittingSignal = signal<boolean>(false);

  readonly engine = signal<FormEngineInstance | null>(null);
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
    ...(this.configSignal()?.layout ?? {}),
  }));

  readonly renderSections = computed(() => {
    const currentEngine = this.engine();
    if (!currentEngine) {
      return [];
    }

    return buildFormSections(this.configSignal(), currentEngine.fields as FormRenderableField[], {
      activeSectionId: this.activeSectionId(),
      submitted: this.submitted(),
    });
  });

  readonly firstRenderSection = computed(() => this.renderSections()[0] ?? null);
  readonly remainingRenderSections = computed(() => this.renderSections().slice(1));

  private readonly flatFields = computed<FieldState[]>(() => {
    const currentEngine = this.engine();
    if (!currentEngine) {
      return [];
    }

    return flattenFormFields(currentEngine.fields as FormRenderableField[]);
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
    const currentEngine = this.engine();
    if (!currentEngine) {
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

  readonly readonlyMode = computed(() => {
    const currentEngine = this.engine();
    const mode = currentEngine?.context?.()?.mode ?? this.contextSignal()?.mode;
    return mode === 'view' && this.layout().readonlyMode !== 'disabled-controls';
  });

  readonly submitDisabled = computed(() => {
    const actions = this.configSignal()?.actions;
    const isLoading = this.loadingSignal();
    const isSubmitting = this.submittingSignal();
    const isReadonly = this.readonlyMode();

    if (isLoading || isSubmitting || isReadonly || actions?.submitDisabled) {
      return true;
    }
    return actions?.disableSubmitWhenInvalid === true && !this.isValid();
  });

  ngOnInit(): void {
    this.syncInputSignals();
    this.rebuildEngine();

    effect(
      () => {
        const currentEngine = this.engine();
        if (!currentEngine) {
          return;
        }
        const model = currentEngine.model();
        this.validChange.emit(currentEngine.valid());
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
    this.syncInputSignals();

    if (changes['config']?.currentValue) {
      this.rebuildEngine();
      return;
    }

    if (changes['context']?.currentValue) {
      const currentEngine = this.engine();
      if (currentEngine) {
        currentEngine.context.set({ ...this.context });
      }
    }

    if (changes['externalErrors']) {
      this.applyExternalErrors();
    }

    if (changes['initialValue']) {
      this.suppressValueChange = true;
      const currentEngine = this.engine();
      if (currentEngine) {
        currentEngine.reset((this.initialValue ?? {}) as object);
      }
    }
  }

  private syncInputSignals(): void {
    if (this.config) {
      this.configSignal.set(this.config);
    }
    if (this.context) {
      this.contextSignal.set(this.context);
    }
    this.initialValueSignal.set(this.initialValue);
    this.loadingSignal.set(this.loading);
    this.submittingSignal.set(this.submitting);
  }

  showSectionNav(): boolean {
    return this.layout().sectionNavigation !== 'none' && this.renderSections().length >= 2;
  }

  onSubmit(): void {
    if (this.submittingSignal() || this.loadingSignal() || this.readonlyMode()) {
      return;
    }

    this.submitted.set(true);
    const currentEngine = this.engine();
    if (!currentEngine) {
      return;
    }
    currentEngine.markAllAsTouched();
    if (!currentEngine.valid()) {
      this.scrollToFirstInvalidField();
      return;
    }
    this.formSubmit.emit(currentEngine.model());
  }

  markAllAsTouched(): void {
    this.engine()?.markAllAsTouched();
  }

  isValid(): boolean {
    return Boolean(this.engine()?.valid?.());
  }

  getModel<TModel = unknown>(): TModel {
    return this.engine()?.model?.() as TModel;
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

    this.scrollToFieldPath(item.fieldPath, 'center');
  }

  onSectionSelect(sectionId: string): void {
    this.activeSectionId.set(sectionId);
    this.scrollToSection(sectionId);
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
    const currentEngine = this.engine();
    if (!currentEngine) {
      return;
    }
    this.flatFields().forEach((field) => field.dirty.set(false));
  }

  resetToInitialValue(): void {
    const currentEngine = this.engine();
    if (!currentEngine) {
      return;
    }

    this.suppressValueChange = true;
    currentEngine.reset((this.initialValueSignal() ?? {}) as object);
    this.submitted.set(false);
  }

  private rebuildEngine(): void {
    this.suppressValueChange = true;
    const context = { ...this.contextSignal() };
    const newEngine = createFormEngine(
      this.configSignal(),
      context,
      (this.initialValueSignal() ?? {}) as object,
    );
    this.engine.set(newEngine);
    this.submitted.set(false);
    this.activeSectionId.set(null);
    this.applyExternalErrors();
  }

  private applyExternalErrors(): void {
    const currentEngine = this.engine();
    if (!currentEngine) {
      return;
    }

    const fields = this.flatFields();
    const lookup = this.fieldLookup();
    fields.forEach((field) => field.externalErrors.set(null));

    for (const error of this.externalErrors ?? []) {
      if (!error.fieldPath) {
        continue;
      }
      const target = lookup.byPath.get(error.fieldPath) ?? lookup.byName.get(error.fieldPath)?.[0];
      if (!target) {
        continue;
      }
      target.externalErrors.set({
        ...(target.externalErrors() ?? {}),
        [`external-${Object.keys(target.externalErrors() ?? {}).length}`]: error.message,
      });
    }
  }

  private scrollToFirstInvalidField(): void {
    if (this.layout().autoScrollToError === false || !this.engine()) {
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

      this.scrollToFieldPath(firstInvalid.path, 'center');
    });
  }

  private scrollToFieldPath(fieldPath: string, block: ScrollLogicalPosition): void {
    const element = this.findHostByAttribute(this.fieldHosts, 'data-field-path', fieldPath);
    this.scrollAndFocus(element, block);
  }

  private scrollToSection(sectionId: string): void {
    const element = this.findHostByAttribute(this.sectionHosts, 'data-form-section-id', sectionId);
    this.scrollAndFocus(element, 'start');
  }

  private findHostByAttribute(
    hosts: QueryList<ElementRef<HTMLElement>> | undefined,
    attribute: string,
    value: string,
  ): HTMLElement | null {
    return (
      hosts?.find((item) => item.nativeElement.getAttribute(attribute) === value)?.nativeElement ??
      null
    );
  }

  private scrollAndFocus(element: HTMLElement | null, block: ScrollLogicalPosition): void {
    if (typeof element?.scrollIntoView === 'function') {
      element.scrollIntoView({ behavior: 'smooth', block });
    }
    element?.focus?.();
  }
}
