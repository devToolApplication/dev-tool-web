import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-spinner',
  standalone: false,
  templateUrl: './progress-spinner.component.html'
})
export class ProgressSpinnerComponent {
  @Input() strokeWidth = '4';
  @Input() styleClass?: string;
}
