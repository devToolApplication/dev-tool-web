import { Component, EventEmitter, Input, Output } from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

export type InputSize = 'small' | 'normal' | 'large';
export type FloatLabelType = 'in' | 'over' | 'on';

export interface SelectOption {
  label: string;
  value: string | number;
}

@Component({
  selector: 'app-select',
  standalone: false,
  templateUrl: './select.html',
  styleUrl: './select.css',
})
export class Select implements ControlValueAccessor {

  @Input() inputId = crypto.randomUUID();
    /* ========= Basic ========= */
  
    @Input() label?: string;
    @Input() placeholder: string | undefined | null;
    @Input() value = '';
    @Input() disabled = false;
    @Input() options: SelectOption[] = [];
    /* ========= UI Options ========= */
  
    @Input() size: InputSize = 'normal';
    @Input() fluid = true;
    @Input() helpText?: string;
    @Input() variant: FloatLabelType = 'on';
    @Input() tooltip?: string;
  
    /* ========= Validation ========= */
  
    @Input() invalid = false;
    @Input() errorMessage?: string;
  
    @Output() valueChange = new EventEmitter<string>();
    @Output() blur = new EventEmitter<void>();
    @Output() focus = new EventEmitter<void>();
  
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
