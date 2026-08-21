import { Component, Input, TemplateRef } from '@angular/core';

type TimelineAlign = 'left' | 'right' | 'top' | 'bottom';
type TimelineLayout = 'vertical' | 'horizontal';

@Component({
  selector: 'app-timeline',
  standalone: false,
  templateUrl: './timeline.component.html'
})
/**
 * @deprecated Use shared/ui/data-display/timeline for new timelines.
 */
export class TimelineComponent<TItem = unknown> {
  @Input() value: TItem[] = [];
  @Input() align: TimelineAlign = 'left';
  @Input() layout: TimelineLayout = 'vertical';
  @Input() styleClass = '';
  @Input() contentTemplate?: TemplateRef<{ $implicit: TItem }>;
  @Input() oppositeTemplate?: TemplateRef<{ $implicit: TItem }>;
  @Input() markerTemplate?: TemplateRef<{ $implicit: TItem }>;
}
