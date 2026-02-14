import { Component, EventEmitter, Input, Output } from '@angular/core';

export type InputSize = 'small' | 'normal' | 'large';
export type FloatLabelType = 'in' | 'on' | 'over';

@Component({
  selector: 'app-input-number',
  standalone: false,
  templateUrl: './input-number.html',
  styleUrl: './input-number.css'
})
export class InputNumber {
  @Input() inputId = crypto.randomUUID();
  /* ========= Basic ========= */

  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() value: number | null = null;
  @Input() disabled = false;

  /* ========= Specific ========= */
  @Input() min?: number;
  @Input() max?: number;

  /* ========= Currency | Decimal ========= */
  @Input() mode?: 'decimal' | 'currency';
  @Input() currency?: string;

  /* ========= UI Options ========= */

  @Input() size: InputSize = 'normal';
  @Input() fluid = true;
  @Input() helpText?: string;
  @Input() variant: FloatLabelType = 'on';
  @Input() tooltip?: string;
  @Input() showClear = false;

  /* ========= Validation ========= */

  @Input() invalid = false;
  @Input() errorMessage?: string;

  /* ========= Decimal Pipe ========= */

  @Input() minFractionDigits?: number;
  @Input() maxFractionDigits?: number;

  @Output() valueChange = new EventEmitter<number | null>();
  @Output() blur = new EventEmitter<void>();
  @Output() focus = new EventEmitter<void>();
}
