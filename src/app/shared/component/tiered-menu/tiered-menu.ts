import { Component, Input } from '@angular/core';
import { AppMenuItem } from '../button-split/button-split';

@Component({
  selector: 'app-tiered-menu',
  standalone: false,
  templateUrl: './tiered-menu.html',
  styleUrl: './tiered-menu.css'
})
export class TieredMenuComponent {
  @Input() items: AppMenuItem[] = [];
  @Input() popup = false;
  @Input() appendTo: HTMLElement | 'body' | null = null;
  @Input() styleClass?: string;
  @Input() ariaLabel = 'Options menu';

  visible = false;

  toggle(event: Event): void {
    event.stopPropagation();
    this.visible = !this.visible;
  }

  hide(): void {
    this.visible = false;
  }

  onItemClick(item: AppMenuItem): void {
    if (item.command) item.command();
    this.hide();
  }
}
