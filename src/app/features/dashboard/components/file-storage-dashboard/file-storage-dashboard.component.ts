import { Component, Input } from '@angular/core';
import { BadgeVariant } from '../../../../shared/ui/data-display/badge/badge.component';
import { DashboardOverview } from '../../dashboard.models';

@Component({
  selector: 'app-file-storage-dashboard',
  standalone: false,
  templateUrl: './file-storage-dashboard.component.html',
  styleUrl: './file-storage-dashboard.component.css'
})
export class FileStorageDashboardComponent {
  @Input() overview: DashboardOverview | null = null;
  @Input() loading = false;
  @Input() error = '';

  resourceVariant(status?: string): BadgeVariant {
    switch ((status || '').toLowerCase()) {
      case 'ok':
      case 'up':
      case 'ready':
      case 'healthy':
      case 'success':
      case 'active':
        return 'success';
      case 'warning':
      case 'degraded':
        return 'warning';
      case 'error':
      case 'failed':
      case 'down':
        return 'danger';
      default:
        return 'default';
    }
  }
}
