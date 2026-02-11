import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-toggle-button',
  standalone: false,
  templateUrl: './toggle-button.html',
  styleUrl: './toggle-button.css'
})
export class ToggleButton {
  @Input() onLabel = 'Bật';
  @Input() offLabel = 'Tắt';
  @Input() onIcon = 'pi pi-check';
  @Input() offIcon = 'pi pi-times';
  @Input() checked = false;
  @Output() checkedChange = new EventEmitter<boolean>();
}
