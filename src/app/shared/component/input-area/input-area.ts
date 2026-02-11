import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-input-area',
  standalone: false,
  templateUrl: './input-area.html',
  styleUrl: './input-area.css'
})
export class InputArea {
  @Input() rows = 4;
  @Input() placeholder = 'Nhập nội dung';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
}
