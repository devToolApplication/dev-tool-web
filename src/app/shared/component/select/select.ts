import { Component, EventEmitter, Input, Output } from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

export interface SelectOption {
  label: string;
  value: string | number;
}

@Component({
  selector: 'app-select',
  standalone: false,
  templateUrl: './select.html',
  styleUrl: './select.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: Select,
      multi: true
    }
  ]
})
export class Select implements ControlValueAccessor {
  @Input() label: string | null | undefined = null;
  @Input() placeholder = 'Chọn giá trị';
  @Input() options: SelectOption[] = [];
  @Input() value: string | number | null = null;
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<string | number | null>();

  @Input() invalid = false;
  @Input() errorMessage?: string;
  
  onChange: any = () => {};
  onTouched: any = () => {};

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: any): void {
    this.value = value;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
