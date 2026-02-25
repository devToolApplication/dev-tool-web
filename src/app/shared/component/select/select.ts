import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseInput } from '../base-input';

export interface SelectOption {
  label: string;
  value: string | number | boolean | null;
}

@Component({
  selector: 'app-select',
  standalone: false,
  templateUrl: './select.html',
  styleUrls: ['./select.css'],
})
export class Select extends BaseInput<string | number | boolean> {
  @Input() options: SelectOption[] | null = [];

  @Input() loading = false;
  @Input() showClear = false;

  constructor() {
    super();
  }
}
