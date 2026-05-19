import { Component, EventEmitter, Input, Output, signal } from '@angular/core';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-alert',
  standalone: false,
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css'
})
export class AlertComponent {
  @Input() variant: AlertVariant = 'info';
  @Input() title?: string;
  @Input() message = '';
  @Input() icon?: string;
  @Input() dismissible = false;
  @Input() actionLabel?: string;

  @Output() dismissed = new EventEmitter<void>();
  @Output() action = new EventEmitter<void>();

  readonly hidden = signal(false);

  get resolvedVariant(): AlertVariant {
    return ['info', 'success', 'warning', 'danger'].includes(this.variant) ? this.variant : 'info';
  }

  get role(): 'alert' | 'status' {
    return this.resolvedVariant === 'danger' || this.resolvedVariant === 'warning' ? 'alert' : 'status';
  }

  get resolvedIcon(): string {
    if (this.icon) {
      return this.icon;
    }
    switch (this.resolvedVariant) {
      case 'success':
        return 'pi pi-check-circle';
      case 'warning':
        return 'pi pi-exclamation-triangle';
      case 'danger':
        return 'pi pi-times-circle';
      case 'info':
      default:
        return 'pi pi-info-circle';
    }
  }

  dismiss(): void {
    this.hidden.set(true);
    this.dismissed.emit();
  }
}
