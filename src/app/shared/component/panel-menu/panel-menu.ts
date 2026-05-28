import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppMenuItem } from '../button-split/button-split';

@Component({
  selector: 'app-panel-menu',
  standalone: false,
  templateUrl: './panel-menu.html',
  styleUrl: './panel-menu.css'
})
export class PanelMenuComponent {
  @Input() model: AppMenuItem[] = [];
  @Input() multiple = true;
  @Input() styleClass?: string;

  @Output() itemClick = new EventEmitter<AppMenuItem>();

  expandedItems = new Set<string>();

  toggleItem(item: AppMenuItem): void {
    const key = item.label || '';
    if (this.expandedItems.has(key)) {
      this.expandedItems.delete(key);
    } else {
      if (!this.multiple) this.expandedItems.clear();
      this.expandedItems.add(key);
    }
  }

  isExpanded(item: AppMenuItem): boolean {
    return this.expandedItems.has(item.label || '');
  }

  onLeafClick(item: AppMenuItem): void {
    if (item.command) item.command();
    this.itemClick.emit(item);
  }
}
