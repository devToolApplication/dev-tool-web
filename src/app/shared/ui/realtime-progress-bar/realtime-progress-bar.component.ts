import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TaskProgressState } from '../../../core/models/realtime/realtime.model';

@Component({
  selector: 'app-realtime-progress-bar',
  standalone: false,
  templateUrl: './realtime-progress-bar.component.html',
  styleUrl: './realtime-progress-bar.component.css'
})
export class RealtimeProgressBarComponent {
  @Input() state?: TaskProgressState | null;
  @Input() showCancel = false;
  @Input() showDetails = true;
  @Output() cancel = new EventEmitter<void>();

  percent(): number {
    return Math.min(100, Math.max(0, Number(this.state?.progressPercent ?? 0)));
  }

  canCancel(): boolean {
    return this.showCancel && !!this.state && !['COMPLETED', 'SKIPPED', 'FAILED', 'CANCELLED'].includes(this.state.status);
  }
}
