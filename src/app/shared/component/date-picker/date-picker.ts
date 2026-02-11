import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-date-picker',
  standalone: false,
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.css'
})
export class DatePicker {
  @Input() placeholder = 'Select date';
  @Input() showIcon = true;
  @Input() dateFormat = 'dd/mm/yy';
  @Input() value: Date | null = null;
  @Output() valueChange = new EventEmitter<Date | null>();
}
