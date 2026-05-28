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

  get buttonClasses(): Record<string, boolean> {
    return {
      'bg-[var(--app-primary)] text-white shadow-[0_0_14px_rgba(122,119,255,0.2)] hover:brightness-110': !this.severity && !this.text,
      'bg-[var(--app-control-secondary-bg)] text-[var(--app-control-secondary-text)] border border-[var(--app-control-secondary-border)]': this.severity === 'secondary' && !this.text,
      'bg-[var(--app-control-success-bg)] text-[var(--app-control-success-text)] border border-[var(--app-control-success-border)]': this.severity === 'success' && !this.text,
      'bg-[var(--app-control-info-bg)] text-[var(--app-control-info-text)] border border-[var(--app-control-info-border)]': this.severity === 'info' && !this.text,
      'bg-[var(--app-control-warn-bg)] text-[var(--app-control-warn-text)] border border-[var(--app-control-warn-border)]': this.severity === 'warn' && !this.text,
      'bg-[var(--app-control-help-bg)] text-[var(--app-control-help-text)] border border-[var(--app-control-help-border)]': this.severity === 'help' && !this.text,
      'bg-[var(--app-control-danger-bg)] text-[var(--app-control-danger-text)] border border-[var(--app-control-danger-border)]': this.severity === 'danger' && !this.text,
      'bg-[var(--app-control-contrast-bg)] text-[var(--app-control-contrast-text)] border border-[var(--app-control-contrast-border)]': this.severity === 'contrast' && !this.text,
      'bg-transparent border-transparent text-[var(--app-text-soft)] hover:text-[var(--app-primary)] hover:bg-[var(--app-chart-primary-fill)]': this.text
    };
  }
}
