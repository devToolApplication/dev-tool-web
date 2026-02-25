import { Directive, EventEmitter, Input, Output } from '@angular/core';

export type InputSize = 'small' | 'large' | undefined;
export type FloatLabelType = 'in' | 'on' | 'over';

@Directive()
export abstract class BaseInput<T> {
  @Input() inputId: string = crypto.randomUUID();

  /* ========= Basic ========= */
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() value: T | null = null;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() required = false;
  @Input() autofocus = false;

  /* ========= UI Options ========= */
  @Input() size: InputSize;
  @Input() fluid = true;
  @Input() helpText?: string;
  @Input() variant: FloatLabelType = 'on';
  @Input() tooltip?: string;
  @Input() styleClass?: string;

  /* ========= Validation ========= */
  @Input() invalid = false;
  @Input() errorMessage?: string;

  @Output() valueChange = new EventEmitter<T | null>();
  @Output() blur = new EventEmitter<void>();
  @Output() focus = new EventEmitter<void>();
  @Output() select = new EventEmitter<void>();

  onChange(value: T | null): void {
    this.value = value;
    this.valueChange.emit(value);
  }

  onBlur(): void {
    this.blur.emit();
  }

  onFocus(): void {
    this.focus.emit();
  }

  onSelect(): void {
    this.select.emit();
  }
}
