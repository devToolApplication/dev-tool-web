import type { OnChanges, SimpleChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import type { ValueDisplayType } from '@shared/ui/data-display/value-display/value-display.component';
import type { SelectValue } from '@shared/ui/primitives/select/select';
import type {
  AutoCompleteFieldConfig,
  FieldState,
  InputMultiFieldConfig,
  NumberFieldConfig,
  SelectFieldConfig,
  TextFieldConfig,
} from '../../models/form-config.model';

@Component({
  selector: 'app-field-renderer',
  standalone: false,
  templateUrl: './field-renderer.html',
  styleUrl: './field-renderer.css',
})
export class FieldRenderer implements OnChanges {
  @Input({ required: true })
  field!: FieldState;
  @Input() submitted = false;
  @Input() readonlyMode = false;

  numberConfig?: NumberFieldConfig;
  inputMultiConfig?: InputMultiFieldConfig;
  autoCompleteConfig?: AutoCompleteFieldConfig;
  selectConfig?: SelectFieldConfig;
  textConfig?: TextFieldConfig;

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.isNumberLike(this.field?.type)) {
      this.numberConfig = this.field.fieldConfig as NumberFieldConfig;
      this.inputMultiConfig = undefined;
      this.autoCompleteConfig = undefined;
      this.selectConfig = undefined;
      this.textConfig = undefined;
    } else if (this.isAutoCompleteLike(this.field?.type)) {
      this.numberConfig = undefined;
      this.inputMultiConfig = undefined;
      this.autoCompleteConfig = this.field.fieldConfig as AutoCompleteFieldConfig;
      this.selectConfig = undefined;
      this.textConfig = undefined;
    } else if (this.field?.type === 'input-multi' || this.field?.type === 'tags') {
      this.numberConfig = undefined;
      this.inputMultiConfig = this.field.fieldConfig as InputMultiFieldConfig;
      this.autoCompleteConfig = undefined;
      this.selectConfig = undefined;
      this.textConfig = undefined;
    } else if (
      this.field?.type === 'select' ||
      this.field?.type === 'select-multi' ||
      this.field?.type === 'multi-select'
    ) {
      this.numberConfig = undefined;
      this.inputMultiConfig = undefined;
      this.autoCompleteConfig = undefined;
      this.selectConfig = this.field.fieldConfig as SelectFieldConfig;
      this.textConfig = undefined;
    } else if (this.isTextLike(this.field?.type)) {
      this.numberConfig = undefined;
      this.inputMultiConfig = undefined;
      this.autoCompleteConfig = undefined;
      this.selectConfig = undefined;
      this.textConfig = this.field.fieldConfig as TextFieldConfig;
    } else {
      this.numberConfig = undefined;
      this.inputMultiConfig = undefined;
      this.autoCompleteConfig = undefined;
      this.selectConfig = undefined;
      this.textConfig = undefined;
    }
  }

  get showInvalid() {
    return (
      !this.field.focusing() && (this.field.touched() || this.submitted) && !!this.field.errors()
    );
  }

  get firstErrorMessage(): string | undefined {
    const errors = this.field.errors();
    if (!errors) {
      return undefined;
    }
    return Object.values(errors)[0];
  }

  get isArray() {
    return this.field.type === 'array';
  }

  get helpText(): string | undefined {
    const config = this.field?.fieldConfig;
    return config?.ui?.helpText || config?.helpText;
  }

  get descriptionText(): string | undefined {
    const config = this.field?.fieldConfig;
    return config?.ui?.description || config?.description;
  }

  get fieldControlId(): string {
    const path = this.field?.path || this.field?.name || 'field';
    return `form-field-${path.replace(/[^A-Za-z0-9_-]+/g, '-')}`;
  }

  get fieldDescribedBy(): string | null {
    const parts: string[] = [];
    if (this.descriptionText) {
      parts.push(`${this.fieldControlId}-description`);
    }
    if (this.showInvalid && this.firstErrorMessage) {
      parts.push(`${this.fieldControlId}-error`);
    } else if (this.helpText) {
      parts.push(`${this.fieldControlId}-hint`);
    }
    return parts.length > 0 ? parts.join(' ') : null;
  }

  get resolvedNumberMode(): 'decimal' | 'currency' | undefined {
    if (this.field?.type === 'currency') {
      return 'currency';
    }
    return this.numberConfig?.mode;
  }

  get resolvedNumberSuffix(): string | undefined {
    if (this.field?.type === 'percent') {
      return this.numberConfig?.suffix ?? '%';
    }
    return this.numberConfig?.suffix;
  }

  get resolvedTextContentType(): 'text' | 'json' {
    if (this.field?.type === 'json') {
      return 'json';
    }
    return this.textConfig?.contentType ?? 'text';
  }

  get resolvedTextRows(): number {
    if (this.field?.type === 'json' || this.field?.type === 'code') {
      return this.textConfig?.rows ?? 8;
    }
    return this.textConfig?.rows ?? 5;
  }

  get resolvedTextMaxRows(): number {
    if (this.field?.type === 'json' || this.field?.type === 'code') {
      return this.textConfig?.maxRows ?? 18;
    }
    return this.textConfig?.maxRows ?? 5;
  }

  get textValue(): string | null {
    const value = this.field.value();
    return value == null ? null : String(value);
  }

  get numberValue(): number | null {
    const value = this.field.value();
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  get selectValue(): SelectValue {
    const value = this.field.value();
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
      ? value
      : null;
  }

  get radioValue(): string | number | null {
    const value = this.field.value();
    return typeof value === 'string' || typeof value === 'number' ? value : null;
  }

  get booleanValue(): boolean | null {
    const value = this.field.value();
    return typeof value === 'boolean' ? value : null;
  }

  get dateValue(): Date | Date[] | null {
    const value = this.field.value();
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

  get multiSelectValue(): Array<string | number> {
    const value = this.field.value();
    return Array.isArray(value)
      ? value.filter(
          (item): item is string | number => typeof item === 'string' || typeof item === 'number',
        )
      : [];
  }

  get inputMultiValue(): string[] {
    const value = this.field.value();
    return Array.isArray(value) ? value.map((item) => String(item ?? '')).filter(Boolean) : [];
  }

  get autoCompleteValue(): string | null {
    return this.textValue;
  }

  get colorValue(): string | null {
    return this.textValue;
  }

  get readonlyType(): ValueDisplayType {
    const configuredType = this.field.fieldConfig.ui?.readonlyType;
    if (configuredType) {
      return configuredType;
    }

    switch (this.field.type) {
      case 'number':
      case 'decimal':
        return 'number';
      case 'currency':
        return 'currency';
      case 'percent':
        return 'percent';
      case 'date':
        return 'date';
      case 'datetime':
        return 'datetime';
      case 'checkbox':
      case 'boolean':
        return 'boolean';
      case 'json':
        return 'json';
      default:
        return 'text';
    }
  }

  get readonlyValue(): unknown {
    if (this.field.type === 'select' || this.field.type === 'radio') {
      return this.optionLabelForValue(this.field.value()) ?? this.field.value();
    }

    if (this.field.type === 'select-multi' || this.field.type === 'multi-select') {
      const value = this.field.value();
      if (!Array.isArray(value)) {
        return value;
      }
      return value.map((item) => this.optionLabelForValue(item) ?? String(item)).join(', ');
    }

    if (this.field.type === 'input-multi' || this.field.type === 'tags') {
      return this.inputMultiValue.join(', ');
    }

    return this.field.value();
  }

  get readonlyCurrencyCode(): string {
    return this.numberConfig?.currency ?? 'USD';
  }

  get readonlyPrefix(): string {
    return this.field.fieldConfig.ui?.prefix ?? this.numberConfig?.prefix ?? '';
  }

  get readonlySuffix(): string {
    return this.field.fieldConfig.ui?.suffix ?? this.resolvedNumberSuffix ?? '';
  }

  get usesFieldShell(): boolean {
    return !['record', 'json', 'code'].includes(this.field.type);
  }

  onChangeValue(value: unknown): void {
    this.field.setValue(value);
  }

  onEnter() {
    this.field.focusing.set(true);
    this.field.blurred.set(false);
  }

  onFocus() {
    this.field.focusing.set(true);
    this.field.blurred.set(false);
  }

  onBlur() {
    this.field.focusing.set(false);
    this.field.blurred.set(true);
    this.field.touched.set(true);
  }

  private isNumberLike(type?: string): boolean {
    return type === 'number' || type === 'decimal' || type === 'percent' || type === 'currency';
  }

  private isAutoCompleteLike(type?: string): boolean {
    return type === 'auto-complete' || type === 'autocomplete';
  }

  private isTextLike(type?: string): boolean {
    return type === 'text' || type === 'textarea' || type === 'json' || type === 'code';
  }

  private optionLabelForValue(value: unknown): string | undefined {
    return this.field.options().find((option) => option.value === value)?.label;
  }
}
