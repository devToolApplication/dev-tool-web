import { Component, Input } from '@angular/core';
import { BaseInput, provideValueAccessor } from '../base-input';
import { SelectOption } from '../select/select';

@Component({
  selector: 'app-radio-button',
  standalone: false,
  templateUrl: './radio-button.html',
  styleUrl: './radio-button.css',
  providers: [provideValueAccessor(() => RadioButton)]
})
export class RadioButton extends BaseInput<string | number> {
  @Input() options: SelectOption[] = [];
  @Input() labelPosition: 'top' | 'left' = 'left';
  @Input() optionLayout: 'horizontal' | 'vertical' = 'horizontal';

  groupName = crypto.randomUUID();
}
