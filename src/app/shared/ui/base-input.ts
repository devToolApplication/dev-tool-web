
import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';

export type InputSize = 'small' | 'normal' | 'large';
export type FloatLabelType = 'in' | 'on' | 'over';

@Directive()
export abstract class BaseInput<T> implements ControlValueAccessor {
  @Input() inputId = crypto.randomUUID();
  
  /* ========= Basic ========= */
  @Input() label?: string;
  @Input() placeholder: string | undefined | null;
  @Input() value: T | null = null;
  @Input() disabled = false;

  /* ========= UI Options ========= */
  @Input() size: InputSize = 'normal';
  @Input() fluid = true;
  @Input() helpText?: string;
  @Input() variant: FloatLabelType = 'on';
  @Input() tooltip?: string;

  /* ========= Validation ========= */
  @Input() invalid = false;
  @Input() errorMessage?: string;

  @Output() valueChange = new EventEmitter<T | null>();
  @Output() blur = new EventEmitter<void>();
  @Output() focus = new EventEmitter<void>();

  // ControlValueAccessor implementation
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: T): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
