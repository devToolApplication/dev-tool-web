import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { FormConfig, FormContext } from '../../form-input/models/form-config.model';

export interface ConfigTemplate {
  title?: string;
  description?: string;
  groups: ConfigTemplateGroup[];
}

export interface ConfigTemplateGroup {
  key: string;
  label: string;
  description?: string;
  collapsed?: boolean;
  fields: ConfigTemplateField[];
}

export interface ConfigTemplateField {
  key: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'number'
    | 'decimal'
    | 'percent'
    | 'currency'
    | 'select'
    | 'multi-select'
    | 'autocomplete'
    | 'boolean'
    | 'date'
    | 'datetime'
    | 'json'
    | 'code'
    | 'array'
    | 'record'
    | 'tree'
    | 'secret';
  required?: boolean;
  defaultValue?: unknown;
  placeholder?: string;
  description?: string;
  options?: Array<{ label: string; value: string | number | boolean | null; description?: string; disabled?: boolean }>;
}

@Component({
  selector: 'app-config-template-form',
  standalone: false,
  templateUrl: './config-template-form.component.html',
  styleUrl: './config-template-form.component.css'
})
/**
 * Convenience wrapper around app-form-input for isolated template editing.
 * app-form-input remains the shared FormConfig rendering engine used by feature CRUD pages.
 */
export class ConfigTemplateFormComponent implements OnChanges {
  @Input() config!: FormConfig;
  @Input() context!: FormContext;
  @Input() initialValue: unknown = {};
  @Input() submitting = false;
  @Input() title?: string;
  @Input() description?: string;
  @Input() showAdvancedJson = true;
  @Input() advancedJsonEditable = false;

  @Output() formSubmit = new EventEmitter<unknown>();
  @Output() valueChange = new EventEmitter<unknown>();

  readonly advancedCollapsed = true;
  readonly formInitialValue = signal<unknown>({});
  readonly currentValue = signal<unknown>({});
  readonly advancedJsonDraft = signal<string | null>(null);
  readonly advancedJsonError = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue']) {
      this.formInitialValue.set(this.initialValue ?? {});
      this.currentValue.set(this.initialValue ?? {});
      this.advancedJsonDraft.set(null);
      this.advancedJsonError.set(null);
    }
  }

  onValueChange(value: unknown): void {
    this.currentValue.set(value ?? {});
    this.valueChange.emit(value);
  }

  advancedJsonText(): string {
    return this.advancedJsonDraft() ?? JSON.stringify(this.currentValue() ?? {}, null, 2);
  }

  onAdvancedJsonChange(value: string | null): void {
    this.advancedJsonDraft.set(value ?? '');
    this.advancedJsonError.set(null);
  }

  applyAdvancedJson(): void {
    try {
      const parsed = JSON.parse(this.advancedJsonText());
      this.formInitialValue.set(parsed);
      this.currentValue.set(parsed);
      this.advancedJsonDraft.set(null);
      this.advancedJsonError.set(null);
      this.valueChange.emit(parsed);
    } catch {
      this.advancedJsonError.set('shared.json.invalid');
    }
  }

  resetAdvancedJson(): void {
    this.advancedJsonDraft.set(null);
    this.advancedJsonError.set(null);
  }
}
