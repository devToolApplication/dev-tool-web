import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-password',
  standalone: false,
  templateUrl: './password.html',
  styleUrl: './password.css'
})
export class Password {
  @Input() placeholder = 'Password';
  @Input() feedback = true;
  @Input() toggleMask = true;
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
}
