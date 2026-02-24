import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-button-split',
  standalone: false,
  templateUrl: './button-split.html',
  styleUrl: './button-split.css'
})
export class ButtonSplit {
  @Input() label = 'Actions';
  @Input() icon = 'pi pi-cog';
  @Input() model: MenuItem[] = [];
  @Output() buttonClick = new EventEmitter<void>();

  constructor(private readonly i18nService: I18nService) {}

  get translatedModel(): MenuItem[] {
    return this.model.map((item) => this.translateItem(item));
  }

  private translateItem(item: MenuItem): MenuItem {
    return {
      ...item,
      label: item.label ? this.i18nService.t(item.label) : item.label,
      items: item.items?.map((child) => this.translateItem(child))
    };
  }
}
