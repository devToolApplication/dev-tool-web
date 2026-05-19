import { Component, EventEmitter, Input, Output } from '@angular/core';

export type EmptyStateVariant = 'default' | 'search' | 'create' | 'warning';

export interface EmptyStateConfig {
  title: string;
  description?: string;
  icon?: string;
  variant?: EmptyStateVariant;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
}

@Component({
  selector: 'app-empty-state',
  standalone: false,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css'
})
export class EmptyStateComponent {
  @Input() title = 'shared.empty.title';
  @Input() description?: string;
  @Input() icon?: string;
  @Input() variant: EmptyStateVariant = 'default';
  @Input() size: 'default' | 'compact' = 'default';
  @Input() align: 'start' | 'center' = 'center';
  @Input() primaryActionLabel?: string;
  @Input() secondaryActionLabel?: string;

  @Output() primaryAction = new EventEmitter<void>();
  @Output() secondaryAction = new EventEmitter<void>();

  get resolvedIcon(): string {
    if (this.icon) {
      return this.icon;
    }

    switch (this.variant) {
      case 'search':
        return 'pi pi-search';
      case 'create':
        return 'pi pi-plus-circle';
      case 'warning':
        return 'pi pi-exclamation-triangle';
      case 'default':
      default:
        return 'pi pi-inbox';
    }
  }
}
