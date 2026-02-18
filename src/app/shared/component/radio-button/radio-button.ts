import { Component, Input } from '@angular/core';
import { BaseInput } from '../base-input';
import { SelectOption } from '../../ui/form-input/models/form-config.model';

@Component({
  selector: 'app-radio-button',
  standalone: false,
  templateUrl: './radio-button.html',
  styleUrl: './radio-button.css',
})
export class RadioButton extends BaseInput<string | number> {
  @Input() options: SelectOption[] = [];
  @Input() labelPosition: 'top' | 'left' = 'left';
  @Input() optionLayout: 'horizontal' | 'vertical' = 'horizontal';

  groupName = crypto.randomUUID();
}
