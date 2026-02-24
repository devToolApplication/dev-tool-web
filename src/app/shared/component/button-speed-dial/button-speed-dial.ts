import { Component, Input } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-button-speed-dial',
  standalone: false,
  templateUrl: './button-speed-dial.html',
  styleUrl: './button-speed-dial.css'
})
export class ButtonSpeedDial {
  @Input() model: MenuItem[] = [];
  @Input() direction: 'up' | 'down' | 'left' | 'right' = 'up';
  @Input() type: 'linear' | 'circle' | 'semi-circle' | 'quarter-circle' = 'linear';
  @Input() showIcon = 'pi pi-bars';
  @Input() hideIcon = 'pi pi-times';

  constructor(private readonly i18nService: I18nService) {}

  get translatedModel(): MenuItem[] {
    return this.model.map((item) => ({
      ...item,
      label: item.label ? this.i18nService.t(item.label) : item.label
    }));
  }
}
