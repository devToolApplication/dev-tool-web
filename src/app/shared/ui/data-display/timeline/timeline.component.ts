import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BadgeVariant } from '../badge/badge.component';

export interface TimelineItem {
  id?: string | number;
  title: string;
  description?: string;
  time?: string | Date | number;
  icon?: string;
  variant?: BadgeVariant;
  actionLabel?: string;
  data?: unknown;
}

@Component({
  selector: 'app-data-timeline',
  standalone: false,
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.css'
})
export class TimelineComponent {
  @Input() items: TimelineItem[] = [];
  @Input() loading = false;
  @Input() error?: string | null;
  @Input() emptyTitle = 'shared.empty.title';
  @Input() timestampFormat = 'dd/MM/yyyy HH:mm:ss';

  @Output() retry = new EventEmitter<void>();
  @Output() itemAction = new EventEmitter<TimelineItem>();
}
