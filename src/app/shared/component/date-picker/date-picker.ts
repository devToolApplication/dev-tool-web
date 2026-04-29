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
}
