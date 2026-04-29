import { Component, Input } from '@angular/core';
import { BaseInput, provideValueAccessor } from '../base-input';

export interface SelectOption {
  label: string;
  value: string | number | boolean | null;
}

@Component({
  selector: 'app-select',
  standalone: false,
  templateUrl: './select.html',
  styleUrls: ['./select.css'],
  providers: [provideValueAccessor(() => Select)]
})
export class Select extends BaseInput<string | number | boolean> {
  @Input() options: SelectOption[] | null = [];

  @Input() loading = false;
  @Input() showClear = false;

  constructor() {
    super();
  }
}
