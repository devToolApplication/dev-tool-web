import { Component, Input } from '@angular/core';
import { BaseInput } from '../base-input';
import { I18nService } from '../../../core/services/i18n.service';

export interface SelectOption {
  label: string;
  value: string | number;
}

@Component({
  selector: 'app-select',
  standalone: false,
  templateUrl: './select.html',
  styleUrls: ['./select.css'],
})
export class Select extends BaseInput<string | number> {
  @Input() options: SelectOption[] | null = [];

  @Input() loading = false;

  constructor(private readonly i18nService: I18nService) {
    super();
  }

  get translatedOptions(): SelectOption[] {
    return (this.options ?? []).map((option) => ({
      ...option,
      label: this.i18nService.t(option.label)
    }));
  }
}

