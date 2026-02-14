import { Component, Input } from '@angular/core';
import { SelectOption } from '../select/select';
import { BaseInput } from '../base-input';

@Component({
  selector: 'app-select-multi',
  standalone: false,
  templateUrl: './select-multi.html',
  styleUrl: './select-multi.css'
})
export class SelectMulti extends BaseInput<Array<string | number>> {
  @Input() options: SelectOption[] = [];

  @Input() display = 'chip';
  @Input() enableFilter = false;
  @Input() maxSelectedLabels: number | null | undefined;
  @Input() selectionLimit: number | null | undefined;
  @Input() loading = false;
  constructor() {
    super();
  }
}
