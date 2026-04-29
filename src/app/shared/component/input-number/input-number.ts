import { Component, Input } from '@angular/core';
import { BaseInput, provideValueAccessor } from '../base-input';

@Component({
  selector: 'app-input-number',
  standalone: false,
  templateUrl: './input-number.html',
  styleUrl: './input-number.css',
  providers: [provideValueAccessor(() => InputNumber)]
})
export class InputNumber extends BaseInput<number> {
  /* ========= Specific ========= */
  @Input() min?: number;
  @Input() max?: number;
  @Input() step?: number;

  /* ========= Currency | Decimal ========= */
  @Input() mode?: 'decimal' | 'currency';
  @Input() currency?: string;

  /* ========= UI Options ========= */
  @Input() showClear = false;

  /* ========= Decimal Pipe ========= */
  @Input() minFractionDigits?: number;
  @Input() maxFractionDigits?: number;
}
