import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseInput } from '../base-input';

@Component({
  selector: 'app-date-picker',
  standalone: false,
  templateUrl: './date-picker.html',
  styleUrls: ['./date-picker.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePicker),
      multi: true
    }
  ]
})
export class DatePicker extends BaseInput<Date | Date[] | null> {
  @Input() showIcon = true;
  @Input() dateFormat = 'dd/mm/yy';
  @Input() showTime = false;
  @Input() hourFormat: '12' | '24' = '24';
  @Input() selectionMode: 'single' | 'multiple' | 'range' = 'single';

  constructor() {
    super();
  }

  get dateStringValue(): string {
    if (!this.value || Array.isArray(this.value)) return '';
    const d = this.value instanceof Date ? this.value : new Date(this.value);
    if (isNaN(d.getTime())) return '';
    if (this.showTime) {
      return d.toISOString().slice(0, 16);
    }
    return d.toISOString().slice(0, 10);
  }

  onDateInput(value: string): void {
    if (!value) {
      this.onChange(null);
      return;
    }
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      this.onChange(date);
    }
  }
}
