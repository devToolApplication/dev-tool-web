import { Component, EventEmitter, Input, Output } from '@angular/core';

export type InputSize = 'small' | 'normal' | 'large';

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
  @Input() placeholder = 'Nhập nội dung';
  @Input() value = '';
  @Input() disabled = false;

  /* ========= UI Options ========= */

  @Input() size: InputSize = 'normal';
  @Input() fluid = true;
  @Input() helpText?: string;

  /* ========= Validation ========= */

  @Input() invalid = false;
  @Input() errorMessage?: string;

  @Output() valueChange = new EventEmitter<string>();
}
