import { Component, Input } from '@angular/core';
import { BaseInput, provideValueAccessor } from '../base-input';
import { SelectOption } from '../select/select';

@Component({
  selector: 'app-select-button',
  standalone: false,
  templateUrl: './select-button.html',
  styleUrl: './select-button.css',
  providers: [provideValueAccessor(() => SelectButton)]
})
export class SelectButton extends BaseInput<string | number | boolean> {
  @Input() options: SelectOption[] = [];
  @Input() multiple = false;
  @Input() allowEmpty = true;
  @Input() optionLabel = 'label';
  @Input() optionValue = 'value';
}
