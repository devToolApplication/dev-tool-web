import { Component, EventEmitter, Input, Output } from '@angular/core';

export type InputSize = 'small' | 'normal' | 'large';
export type FloatLabelType = 'auto' | 'always';

@Component({
  selector: 'app-input-text',
  standalone: false,
  templateUrl: './input-text.html',
  styleUrl: './input-text.css'
})
export class InputText {
  @Input() inputId = crypto.randomUUID();
  /* ========= Basic ========= */

  @Input() label?: string;
  @Input() placeholder: string | undefined | null;
  @Input() value = '';
  @Input() disabled = false;

  /* ========= UI Options ========= */

  @Input() size: InputSize = 'normal';
  @Input() fluid = true;
  @Input() helpText?: string;
  @Input() variant: FloatLabelType = 'auto';
  @Input() tooltip?: string;

  /* ========= Validation ========= */

  @Input() invalid = false;
  @Input() errorMessage?: string;

  @Output() valueChange = new EventEmitter<string>();
  @Output() blur = new EventEmitter<void>();
  @Output() focus = new EventEmitter<void>();
}
