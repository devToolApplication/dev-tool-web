import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.html',
  styleUrl: './button.css',
})
export class Button {
  @Input() label?: string;
  @Input() icon?: string;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() iconOnly = false;
  @Input() loading = false;
  @Input() disabled = false;
  @Input() ariaLabel?: string;
  @Input() tooltip?: string;
  @Input() styleClass?: string;

  @Output() buttonClick = new EventEmitter<void>();

  get resolvedAriaLabel(): string | null {
    return this.ariaLabel || this.tooltip || (this.iconOnly ? this.label : undefined) || null;
  }

  get computedClasses(): string[] {
    const classes = ['app-button', `app-button--${this.variant}`, `app-button--${this.size}`];
    if (this.iconOnly || (!this.label && !!this.icon)) {
      classes.push('app-button--icon-only');
    }
    if (this.styleClass) {
      classes.push(this.styleClass);
    }
    return classes;
  }

  onClick(event: Event): void {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.buttonClick.emit();
  }
}
