import { Component, Input } from '@angular/core';
import {
  FieldState,
  NumberFieldConfig,
  TextFieldConfig
} from '../../models/form-config.model';
import { ValueDisplayType } from '../../../data-display/value-display/value-display.component';

@Component({
  selector: 'app-readonly-field',
  standalone: false,
  templateUrl: './readonly-field.html',
  styleUrl: './readonly-field.css'
})
export class ReadonlyFieldComponent {
  @Input({ required: true }) field!: FieldState;

  get helpText(): string | undefined {
    const config = this.field?.fieldConfig as { helpText?: string; description?: string; ui?: { helpText?: string; description?: string } };
    return config?.ui?.helpText || config?.helpText || config?.ui?.description || config?.description;
  }

  get displayType(): ValueDisplayType {
    const configured = (this.field.fieldConfig as { ui?: { readonlyType?: ValueDisplayType } }).ui?.readonlyType;
    if (configured) {
      return configured;
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
      case 'code':
      case 'record':
      case 'array':
      case 'secret-metadata':
      case 'tree':
        return 'json';
      default:
        return this.isCopyable ? 'copyable' : 'text';
    }
  }

  get value(): unknown {
    return this.field.value();
  }

  get isJsonValue(): boolean {
    return this.displayType === 'json' || this.field.type === 'json' || this.field.type === 'code';
  }

  get isCopyable(): boolean {
    const config = this.field.fieldConfig as { ui?: { copyable?: boolean } };
    return (
      config.ui?.copyable === true ||
      /(^id$|id$|code$|url$|path$|key$)/i.test(this.field.name)
    );
  }

  get maskSecrets(): boolean {
    return this.field.type === 'secret-metadata' || (this.field.fieldConfig as { ui?: { masked?: boolean } }).ui?.masked === true;
  }

  get numberConfig(): NumberFieldConfig | undefined {
    return this.isNumberLike ? (this.field.fieldConfig as NumberFieldConfig) : undefined;
  }

  get textConfig(): TextFieldConfig | undefined {
    return this.field.type === 'json' || this.field.type === 'code' || this.field.type === 'textarea' || this.field.type === 'text'
      ? (this.field.fieldConfig as TextFieldConfig)
      : undefined;
  }

  get prefix(): string {
    const uiPrefix = (this.field.fieldConfig as { ui?: { prefix?: string } }).ui?.prefix;
    return uiPrefix ?? this.numberConfig?.prefix ?? '';
  }

  get suffix(): string {
    const uiSuffix = (this.field.fieldConfig as { ui?: { suffix?: string } }).ui?.suffix;
    if (uiSuffix) {
      return uiSuffix;
    }
    if (this.field.type === 'percent') {
      return this.numberConfig?.suffix ?? '%';
    }
    return this.numberConfig?.suffix ?? '';
  }

  get currencyCode(): string {
    return this.numberConfig?.currency ?? 'USD';
  }

  private get isNumberLike(): boolean {
    return this.field.type === 'number' || this.field.type === 'decimal' || this.field.type === 'percent' || this.field.type === 'currency';
  }
}
