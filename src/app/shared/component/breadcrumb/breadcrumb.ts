import { Component, Input } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-breadcrumb',
  standalone: false,
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css'
})
export class Breadcrumb {
  @Input() home: MenuItem = { icon: 'pi pi-home' };
  @Input() items: MenuItem[] = [];

  constructor(private readonly i18nService: I18nService) {}

  get translatedHome(): MenuItem {
    return this.translateItem(this.home);
  }

  get translatedItems(): MenuItem[] {
    return this.items.map((item) => this.translateItem(item));
  }

  private translateItem(item: MenuItem): MenuItem {
    return {
      ...item,
      label: item.label ? this.i18nService.t(item.label) : item.label,
      items: item.items?.map((child) => this.translateItem(child))
    };
  }
}
