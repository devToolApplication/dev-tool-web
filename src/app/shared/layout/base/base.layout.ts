import { Component } from '@angular/core';
import { APP_LAYOUT_MENU } from '../config/menu.config';
import { AppMenuItem } from '../side-menu/side-menu.component';

@Component({
  selector: 'app-base-layout',
  standalone: false,
  templateUrl: './base.layout.html',
  styleUrls: ['./base.layout.css']
})
export class BaseLayoutComponent {
  readonly menuItems: AppMenuItem[] = APP_LAYOUT_MENU;
}
