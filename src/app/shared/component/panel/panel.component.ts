import { Component, Input } from '@angular/core';

type PanelSurface = 'default' | 'strong';

@Component({
  selector: 'app-panel',
  standalone: false,
  templateUrl: './panel.component.html',
  styleUrl: './panel.component.css'
})
/**
 * @deprecated Use shared/ui/layout/section-panel or shared/ui/data-display/card style blocks for new composed panels.
 */
export class PanelComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() surface: PanelSurface = 'default';
}
