import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-check-box',
  standalone: false,
  templateUrl: './check-box.html',
  styleUrl: './check-box.css'
})
export class CheckBox {
  @Input() inputId = 'checkbox';
  @Input() label = 'Checkbox';
  @Input() checked = false;
  @Output() checkedChange = new EventEmitter<boolean>();
}
