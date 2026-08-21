import { Directive, EventEmitter, forwardRef, Input, Output, Provider, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export function provideValueAccessor(component: () => unknown): Provider {
  return {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(component),
    multi: true
  };
}

@Directive()
export abstract class BaseInput<T> implements ControlValueAccessor {
  @Input() inputId: string = crypto.randomUUID();
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() value: T | null = null;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() required = false;
  @Input() autofocus = false;
  @Input() styleClass?: string;
  @Input() iconClass?: string;
  @Input() invalid = false;
  @Input() helpText?: string;
  @Input() errorMessage?: string;

  @Output() valueChange = new EventEmitter<T | null>();
  @Output() blur = new EventEmitter<void>();
  @Output() focus = new EventEmitter<void>();
  @Output() select = new EventEmitter<void>();

  private propagateChange: (value: T | null) => void = () => undefined;
  private propagateTouched: () => void = () => undefined;

  writeValue(value: T | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.propagateTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onChange(value: T | null): void {
    this.value = value;
    this.propagateChange(value);
    this.valueChange.emit(value);
  }

  onBlur(): void {
    this.propagateTouched();
    this.blur.emit();
  }

  onFocus(): void {
    this.focus.emit();
  }

  onSelect(): void {
    this.select.emit();
  }
}
