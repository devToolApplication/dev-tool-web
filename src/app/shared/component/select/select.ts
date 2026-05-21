import { Component, Input } from '@angular/core';
import { BaseInput, provideValueAccessor } from '../base-input';

export type SelectValue = string | number | boolean | null;

export interface SelectOption {
  label: string;
  value: SelectValue;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  label: string;
  value?: SelectValue;
  disabled?: boolean;
  items: SelectOption[];
}

export type SelectOptions = SelectOption[] | SelectOptionGroup[];

@Component({
  selector: 'app-select',
  standalone: false,
  templateUrl: './select.html',
  styleUrls: ['./select.css'],
  providers: [provideValueAccessor(() => Select)]
})
export class Select extends BaseInput<SelectValue> {
  @Input() options: SelectOptions | null = [];

  @Input() optionLabel = 'label';
  @Input() optionValue = 'value';
  @Input() optionDisabled = 'disabled';
  @Input() group = false;
  @Input() optionGroupLabel = 'label';
  @Input() optionGroupChildren = 'items';

  @Input() loading = false;
  @Input() showClear = false;

  constructor() {
    super();
  }
}
