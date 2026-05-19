import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-card',
  standalone: false,
  templateUrl: './skeleton-card.component.html'
})
export class SkeletonCardComponent {
  @Input() rows = 4;
  @Input() animated = true;
}
