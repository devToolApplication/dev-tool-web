import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type BadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'danger' | 'muted';
export type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'app-badge',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.css'
})
export class BadgeComponent {
  @Input() label = '';
  @Input() variant: BadgeVariant = 'default';
  @Input() size: BadgeSize = 'md';
  @Input() icon?: string;
  @Input() tooltip?: string;

  get resolvedVariant(): BadgeVariant {
    return ['default', 'info', 'success', 'warning', 'danger', 'muted'].includes(this.variant)
      ? this.variant
      : 'default';
  }
}
