import { Component, Input } from '@angular/core';
import { AppMenuItem } from '../button-split/button-split';

@Component({
  selector: 'app-breadcrumb',
  standalone: false,
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css'
})
export class Breadcrumb {
  @Input() home: AppMenuItem = { icon: 'pi pi-home', label: 'Home' };
  @Input() items: AppMenuItem[] = [];
}
