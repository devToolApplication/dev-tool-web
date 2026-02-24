import { Component, Input } from '@angular/core';
import { BaseInput } from '../base-input';
import { SelectOption } from '../select/select';
import { I18nService } from '../../../core/services/i18n.service';

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

  constructor(private readonly i18nService: I18nService) {
    super();
  }

  get translatedOptions(): SelectOption[] {
    return this.options.map((option) => ({
      ...option,
      label: this.i18nService.t(option.label)
    }));
  }
}
