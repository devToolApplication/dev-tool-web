import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-form',
  standalone: false,
  templateUrl: './skeleton-form.component.html'
})
export class SkeletonFormComponent {
  @Input() rows = 4;
  @Input() animated = true;
}
