import { Component, forwardRef, Input } from '@angular/core';
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

  groupdName = crypto.randomUUID()

  constructor() {
    super();
  }

  onValueChange(value: string | number): void {
    this.value = value;
    if (this.valueChange) {
      this.valueChange.emit(value);
    }
  }

  onBlur(): void {
    if (this.blur) {
      this.blur.emit();
    }
  }
}
