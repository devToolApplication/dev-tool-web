import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: false,
  templateUrl: './button.html',
  styleUrl: './button.css'
})
export class Button {
  @Input() label = 'Button';
  @Input() icon?: string;
  @Input() severity: 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast' | null = null;
  @Input() disabled = false;
  @Output() buttonClick = new EventEmitter<void>();
}
