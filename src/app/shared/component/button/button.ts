import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BaseInput } from '../base-input';

@Component({
  selector: 'app-button',
  standalone: false,
  templateUrl: './button.html',
  styleUrl: './button.css'
})
export class Button extends BaseInput<void> {
  @Input() icon?: string;
  @Input() severity: 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast' | null = null;

  @Output() buttonClick = new EventEmitter<void>();
}
