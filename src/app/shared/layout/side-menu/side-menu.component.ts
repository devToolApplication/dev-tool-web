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
}
