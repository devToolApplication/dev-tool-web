import { Component, Input } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-breadcrumb',
  standalone: false,
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css'
})
export class Breadcrumb {
  @Input() home: MenuItem = { icon: 'pi pi-home' };
  @Input() items: MenuItem[] = [];
}
