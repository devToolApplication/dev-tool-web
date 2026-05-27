import { Component, Input, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { TieredMenu } from 'primeng/tieredmenu';

@Component({
  selector: 'app-tiered-menu',
  standalone: false,
  templateUrl: './tiered-menu.html',
  styleUrl: './tiered-menu.css'
})
export class TieredMenuComponent {
  @Input() items: MenuItem[] = [];
  @Input() popup = false;
  @Input() appendTo: HTMLElement | 'body' | null = null;
  @Input() styleClass?: string;
  @Input() ariaLabel = 'Options menu';

  @ViewChild(TieredMenu) private menu?: TieredMenu;

  toggle(event: Event): void {
    this.menu?.toggle(event);
  }

  hide(): void {
    this.menu?.hide();
  }
}
