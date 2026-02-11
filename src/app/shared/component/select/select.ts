import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface SelectOption {
  label: string;
  value: string | number;
}

@Component({
  selector: 'app-select',
  standalone: false,
  templateUrl: './select.html',
  styleUrl: './select.css'
})
export class Select {
  @Input() placeholder = 'Chọn giá trị';
  @Input() options: SelectOption[] = [];
  @Input() value: string | number | null = null;
  @Output() valueChange = new EventEmitter<string | number | null>();
}
