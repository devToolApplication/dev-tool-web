import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SelectOption } from '../select/select';

@Component({
  selector: 'app-select-button',
  standalone: false,
  templateUrl: './select-button.html',
  styleUrl: './select-button.css'
})
export class SelectButton {
  @Input() options: SelectOption[] = [];
  @Input() value: string | number | null = null;
  @Output() valueChange = new EventEmitter<string | number | null>();
}
