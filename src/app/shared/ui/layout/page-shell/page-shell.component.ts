import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import type { PageHeaderStatus } from '../page-header/page-header.component';
import type { UiBreadcrumbItem } from '../../types/router-link.model';

export type PageShellLayout = 'default' | 'wide' | 'full';

export interface PageShellConfig {
  title: string;
  subtitle?: string;
  status?: PageHeaderStatus;
  layout?: PageShellLayout;
}

@Component({
  selector: 'app-page-shell',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-shell.component.html',
  styleUrl: './page-shell.component.css',
})
export class PageShellComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() status?: PageHeaderStatus | null;
  @Input() breadcrumb?: UiBreadcrumbItem[];
  @Input() layout: PageShellLayout = 'default';
  @Input() loading = false;
  @Input() error?: string | null;
  @Input() empty = false;
  @Input() emptyTitle = 'shared.empty.title';
  @Input() emptyDescription?: string;

  @Output() retry = new EventEmitter<void>();
}
