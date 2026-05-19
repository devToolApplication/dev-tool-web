import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-table',
  standalone: false,
  templateUrl: './skeleton-table.component.html'
})
export class SkeletonTableComponent {
  @Input() rows = 4;
  @Input() columns = 4;
  @Input() animated = true;
}
