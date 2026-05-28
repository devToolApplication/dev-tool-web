import { Component, Input } from '@angular/core';
import { BadgeVariant } from '../../../../shared/ui/data-display/badge/badge.component';
import { StatusListItem } from '../../../../shared/ui/data-display/status-list/status-list.component';
import { DashboardOverview } from '../../dashboard.models';

@Component({
  selector: 'app-ai-agent-dashboard',
  standalone: false,
  templateUrl: './ai-agent-dashboard.component.html',
  styleUrl: './ai-agent-dashboard.component.css'
})
export class AiAgentDashboardComponent {
  @Input() overview: DashboardOverview | null = null;
  @Input() loading = false;
  @Input() error = '';

  get resourceItems(): StatusListItem[] {
    return (this.overview?.resources ?? []).map((resource) => ({
      title: resource.name,
      description: resource.description,
      status: resource.status,
      statusVariant: this.resourceVariant(resource.status),
      value: resource.value || '-'
    }));
  }

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
