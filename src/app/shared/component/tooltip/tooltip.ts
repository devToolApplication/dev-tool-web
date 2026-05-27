import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-tooltip',
  standalone: false,
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.css'
})
export class TooltipComponent {
  @Input() text = '';
  @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() autoHide = true;
  @Input() showDelay?: number;
  @Input() hideDelay?: number;
  @Input() styleClass?: string;
}
