import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BadgeVariant } from '../../data-display/badge/badge.component';

export interface PageHeaderStatus {
  label: string;
  variant?: BadgeVariant;
  icon?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: false,
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css'
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() breadcrumb?: Array<{ label: string; routerLink?: string | any[] }>;
  @Input() status?: PageHeaderStatus | null;
  @Input() showBack = false;
  @Input() backLabel = 'back';

  @Output() back = new EventEmitter<void>();
}
