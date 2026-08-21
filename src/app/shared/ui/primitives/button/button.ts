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
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() text = false;
  @Input() loading = false;
  @Input() severity: 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast' | null = null;
  @Input() routerLink?: string | any[];
  @Input() queryParams?: Record<string, unknown>;
  @Input() ariaLabel?: string;

  @Output() buttonClick = new EventEmitter<void>();

  get computedClass(): string {
    if (this.text) return 'app-btn--text';
    switch (this.severity) {
      case 'secondary': return 'app-btn--secondary';
      case 'success': return 'app-btn--success';
      case 'info': return 'app-btn--info';
      case 'warn': return 'app-btn--warn';
      case 'help': return 'app-btn--help';
      case 'danger': return 'app-btn--danger';
      case 'contrast': return 'app-btn--contrast';
      default: return 'app-btn--primary';
    }
  }
}
