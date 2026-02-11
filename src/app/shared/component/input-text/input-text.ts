import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-input-text',
  standalone: false,
  templateUrl: './input-text.html',
  styleUrl: './input-text.css'
})
export class InputText {
  @Input() placeholder = 'Nhập nội dung';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
}
