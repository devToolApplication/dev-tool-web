import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-toggle-switch',
  standalone: false,
  templateUrl: './toggle-switch.html',
  styleUrl: './toggle-switch.css'
})
export class ToggleSwitch {
  @Input() inputId = 'toggle-switch';
  @Input() checked = false;
  @Output() checkedChange = new EventEmitter<boolean>();
}
