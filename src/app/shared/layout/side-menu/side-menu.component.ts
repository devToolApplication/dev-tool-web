import { Component, Input } from '@angular/core';
import { MenuItem } from 'primeng/api';

export interface AppMenuItem extends MenuItem {
  badge?: string;
  shortcut?: string;
  items?: AppMenuItem[];
}

@Component({
  selector: 'app-side-menu',
  standalone: false,
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss']
})
export class SideMenuComponent {
  @Input() items: AppMenuItem[] = [];

  readonly expandedState = new Set<string>();

  constructor() {
    this.expandedState.add('root/Reports/Analytics');
  }

  isExpanded(path: string): boolean {
    return this.expandedState.has(path);
  }

  toggle(path: string): void {
    if (this.expandedState.has(path)) {
      this.expandedState.delete(path);
      return;
    }

    this.expandedState.add(path);
  }
}
