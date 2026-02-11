import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SelectOption } from '../select/select';

@Component({
  selector: 'app-select-multi',
  standalone: false,
  templateUrl: './select-multi.html',
  styleUrl: './select-multi.css'
})
export class SelectMulti {
  @Input() placeholder = 'Chọn nhiều giá trị';
  @Input() options: SelectOption[] = [];
  @Input() value: Array<string | number> = [];
  @Output() valueChange = new EventEmitter<Array<string | number>>();
}
