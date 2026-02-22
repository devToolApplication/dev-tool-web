import { Component } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  constructor(private readonly i18nService: I18nService) {}

  t(key: 'app.title' | 'app.settings'): string {
    return this.i18nService.t(key);
  }
}
