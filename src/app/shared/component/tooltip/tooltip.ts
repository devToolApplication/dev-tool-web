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

  visible = false;
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  show(): void {
    if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
    if (this.showDelay) {
      this.showTimer = setTimeout(() => { this.visible = true; }, this.showDelay);
    } else {
      this.visible = true;
    }
  }

  hide(): void {
    if (this.showTimer) { clearTimeout(this.showTimer); this.showTimer = null; }
    if (this.hideDelay) {
      this.hideTimer = setTimeout(() => { this.visible = false; }, this.hideDelay);
    } else {
      this.visible = false;
    }
  }
}
