import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseInput } from '../base-input';

export type DatePickerValue = Date | Array<Date | null> | null;

@Component({
  selector: 'app-date-picker',
  standalone: false,
  templateUrl: './date-picker.html',
  styleUrls: ['./date-picker.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePicker),
      multi: true,
    },
  ],
})
export class DatePicker extends BaseInput<DatePickerValue> {
  @Input() showIcon = true;
  @Input() dateFormat = 'dd/mm/yy';
  @Input() showTime = false;
  @Input() hourFormat: '12' | '24' = '24';
  @Input() selectionMode: 'single' | 'multiple' | 'range' = 'single';
  @Input() labelFrom?: string;
  @Input() labelTo?: string;
  inputIdTo: string = crypto.randomUUID();

  constructor() {
    super();
  }

  get dateStringValue(): string {
    if (!this.value || Array.isArray(this.value)) return '';
    const d = this.value instanceof Date ? this.value : new Date(this.value);
    if (isNaN(d.getTime())) return '';
    return this.showTime ? d.toISOString().slice(0, 16) : d.toISOString().slice(0, 10);
  }

  get rangeFromValue(): string {
    if (this.selectionMode !== 'range' || !Array.isArray(this.value)) return '';
    const d = this.value[0];
    if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
    return this.showTime ? d.toISOString().slice(0, 16) : d.toISOString().slice(0, 10);
  }

  get rangeToValue(): string {
    if (this.selectionMode !== 'range' || !Array.isArray(this.value)) return '';
    const d = this.value[1];
    if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
    return this.showTime ? d.toISOString().slice(0, 16) : d.toISOString().slice(0, 10);
  }

  onRangeFromInput(value: string): void {
    const current = Array.isArray(this.value) ? this.value : [null, null];
    const from = value ? new Date(value) : null;
    if (from && isNaN(from.getTime())) return;
    this.onChange([from, current[1] ?? null]);
  }

  onRangeToInput(value: string): void {
    const current = Array.isArray(this.value) ? this.value : [null, null];
    const to = value ? new Date(value) : null;
    if (to && isNaN(to.getTime())) return;
    this.onChange([current[0] ?? null, to]);
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
