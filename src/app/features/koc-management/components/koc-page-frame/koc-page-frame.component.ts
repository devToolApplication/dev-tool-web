import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { BadgeVariant } from '@shared/ui/data-display/badge/badge.component';

interface KocPageStatus {
  label: string;
  variant?: BadgeVariant;
  icon?: string;
}

@Component({
  selector: 'app-koc-page-frame',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './koc-page-frame.component.html',
})
export class KocPageFrameComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() status?: KocPageStatus;
}
