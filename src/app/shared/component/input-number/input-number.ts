import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-input-number',
  standalone: false,
  templateUrl: './input-number.html',
  styleUrl: './input-number.css'
})
export class InputNumber {
  @Input() placeholder = '0';
  @Input() min?: number;
  @Input() max?: number;
  @Input() value: number | null = null;
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<number | null>();
}
