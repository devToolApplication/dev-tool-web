import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-panel-menu',
  standalone: false,
  templateUrl: './panel-menu.html',
  styleUrl: './panel-menu.css'
})
export class PanelMenuComponent {
  @Input() model: MenuItem[] = [];
  @Input() multiple = true;
  @Input() styleClass?: string;

  @Output() itemClick = new EventEmitter<MenuItem>();
}
