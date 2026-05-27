import { Component, Input } from '@angular/core';

export type PrimeBadgeSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
export type PrimeBadgeSize = 'large' | 'xlarge';

@Component({
  selector: 'app-prime-badge',
  standalone: false,
  templateUrl: './prime-badge.html',
  styleUrl: './prime-badge.css'
})
export class PrimeBadgeComponent {
  @Input() value: string | number | null | undefined;
  @Input() severity?: PrimeBadgeSeverity;
  @Input() size?: PrimeBadgeSize;
  @Input() badgeDisabled = false;
  @Input() styleClass?: string;
}
