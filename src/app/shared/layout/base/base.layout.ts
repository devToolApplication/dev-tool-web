import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { APP_LAYOUT_MENU } from '../config/menu.config';

@Component({
  selector: 'app-base-layout',
  standalone: false,
  templateUrl: './base.layout.html',
  styleUrls: ['./base.layout.css']
})
export class BaseLayoutComponent {
  readonly menuItems: MenuItem[] = APP_LAYOUT_MENU;
}
