
import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';

export type InputSize = 'small' | 'large' | undefined;
export type FloatLabelType = 'in' | 'on' | 'over';

@Directive()
export abstract class BaseInput<T> {
  @Input() inputId = crypto.randomUUID();
  
  /* ========= Basic ========= */
  @Input() label?: string;
  @Input() placeholder: string | undefined;
  @Input() value: T | null = null;
  @Input() disabled : boolean = false;

  /* ========= UI Options ========= */
  @Input() size: InputSize;
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
  @Output() select = new EventEmitter<void>();

  onChange(value: any){
    // console.log(value);
    this.valueChange.emit(value);
  }
}
