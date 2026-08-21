import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {
  AutoCompleteFieldConfig,
  FieldState,
  InputMultiFieldConfig,
  NumberFieldConfig,
  SelectFieldConfig,
  TextFieldConfig
} from '../../models/form-config.model';


@Component({
  selector: 'app-field-renderer',
  standalone: false,
  templateUrl: './field-renderer.html',
  styleUrl: './field-renderer.css'
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

  ngOnChanges(changes: SimpleChanges): void {
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
    } else if (this.field?.type === 'select' || this.field?.type === 'select-multi' || this.field?.type === 'multi-select') {
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
    return !this.field.focusing() && (this.field.touched() || this.submitted) && !!this.field.errors();
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
    const config = this.field?.fieldConfig as { helpText?: string; description?: string } | undefined;
    return config?.helpText || config?.description;
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

  onChangeValue(value: any) {
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

}
