import { Component, Input } from '@angular/core';
import { BaseInput, provideValueAccessor } from '../base-input';
import { SelectOption, SelectValue } from '../select/select';

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

  isOptionSelected(val: SelectValue): boolean {
    if (this.multiple && Array.isArray(this.value)) {
      return (this.value as unknown as SelectValue[]).includes(val);
    }
    return this.value === val;
  }

  selectOption(val: SelectValue): void {
    if (this.disabled) return;
    if (this.multiple) {
      const current = Array.isArray(this.value) ? [...(this.value as unknown as SelectValue[])] : [];
      const idx = current.indexOf(val);
      if (idx >= 0) {
        if (this.allowEmpty || current.length > 1) current.splice(idx, 1);
      } else {
        current.push(val);
      }
      this.onChange(current as unknown as string | number | boolean);
    } else {
      if (this.value === val && this.allowEmpty) {
        this.onChange(null as unknown as string | number | boolean);
      } else {
        this.onChange(val as string | number | boolean);
      }
    }
    this.onSelect();
  }
}
