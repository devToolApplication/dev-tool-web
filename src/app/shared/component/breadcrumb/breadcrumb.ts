import { Component, Input } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-breadcrumb',
  standalone: false,
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css'
})
/**
 * @deprecated Prefer shared/ui/layout/page-header breadcrumb support for new pages.
 */
export class Breadcrumb {
  @Input() home: MenuItem = { icon: 'pi pi-home', label: 'Home' };
  @Input() items: MenuItem[] = [];
}
