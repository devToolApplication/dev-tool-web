import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BadgeVariant } from '../badge/badge.component';

export interface StatusListItem {
  title: string;
  description?: string;
  status?: string;
  statusVariant?: BadgeVariant;
  timestamp?: string;
  value?: string;
}

@Component({
  selector: 'app-status-list',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-list.component.html',
  styleUrl: './status-list.component.css'
})
export class StatusListComponent {
  @Input() items: StatusListItem[] = [];
  @Input() density: 'compact' | 'comfortable' = 'compact';

  formattedTimestamp(value: string | undefined): string {
    return value ? new Date(value).toLocaleString() : '';
  }
}
