import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { BadgeVariant } from '../../data-display/badge/badge.component';
import type { UiBreadcrumbItem } from '../../types/router-link.model';

export interface PageHeaderStatus {
  label: string;
  variant?: BadgeVariant;
  icon?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: false,
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css',
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() breadcrumb?: UiBreadcrumbItem[];
  @Input() status?: PageHeaderStatus | null;
  @Input() showBack = false;
  @Input() backLabel = 'back';

  @Output() back = new EventEmitter<void>();
}
