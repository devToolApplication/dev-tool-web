import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'small' | 'large';

@Component({
  selector: 'app-button',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.html',
  styleUrl: './button.css'
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

  /* Backward-compatible setters during Phase 01 migration */
  @Input() set text(isText: boolean) {
    if (isText) {
      this.variant = 'ghost';
    }
  }

  @Input() set severity(sev: 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast' | string | null | undefined) {
    if (!sev) return;
    switch (sev) {
      case 'danger':
        this.variant = 'destructive';
        break;
      case 'secondary':
        this.variant = 'secondary';
        break;
      case 'info':
      case 'contrast':
      case 'warn':
      case 'help':
      case 'success':
      default:
        this.variant = this.variant === 'ghost' ? 'ghost' : 'secondary';
        break;
    }
  }

  @Output() buttonClick = new EventEmitter<void>();

  get normalizedSize(): 'sm' | 'md' | 'lg' {
    if (this.size === 'small') return 'sm';
    if (this.size === 'large') return 'lg';
    return this.size || 'md';
  }

  get resolvedAriaLabel(): string | null {
    return this.ariaLabel || this.tooltip || (this.iconOnly ? this.label : undefined) || null;
  }

  get computedClasses(): string[] {
    const classes = [
      'app-button',
      `app-button--${this.variant}`,
      `app-button--${this.normalizedSize}`
    ];
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
