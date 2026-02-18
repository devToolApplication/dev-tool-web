import { Component, Input } from '@angular/core';
import { BaseInput } from '../base-input';
import { SelectOption } from '../select/select';

@Component({
  selector: 'app-select-button',
  standalone: false,
  templateUrl: './select-button.html',
  styleUrl: './select-button.css'
})
export class SelectButton extends BaseInput<string | number> {
  @Input() options: SelectOption[] = [];
  @Input() multiple = false;
  @Input() allowEmpty = true;
  @Input() optionLabel = 'label';
  @Input() optionValue = 'value';
}
