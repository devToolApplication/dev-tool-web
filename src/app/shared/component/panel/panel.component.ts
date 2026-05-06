import { Component, Input } from '@angular/core';

type PanelSurface = 'default' | 'strong';

@Component({
  selector: 'app-panel',
  standalone: false,
  templateUrl: './panel.component.html',
  styleUrl: './panel.component.css'
})
export class PanelComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() surface: PanelSurface = 'default';
}
