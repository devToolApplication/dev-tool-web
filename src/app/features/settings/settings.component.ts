import { Component } from '@angular/core';
import { ThemeService } from '../../core/ui-services/theme.service';
import { AppLanguage, I18nService } from '../../core/ui-services/i18n.service';

@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  constructor(
    private readonly themeService: ThemeService,
    private readonly i18nService: I18nService
  ) {}

  get darkModeEnabled(): boolean {
    return this.themeService.isDarkMode;
  }

  get language(): AppLanguage {
    return this.i18nService.language();
  }

  get languageOptions(): { label: string; value: AppLanguage }[] {
    return [
      { label: this.i18nService.t('language.vi'), value: 'vi' },
      { label: this.i18nService.t('language.en'), value: 'en' }
    ];
  }

  t(key:
    | 'settings.title'
    | 'settings.description'
    | 'settings.darkMode.title'
    | 'settings.darkMode.description'
    | 'settings.language.title'
    | 'settings.language.description'): string {
    return this.i18nService.t(key);
  }

  onDarkModeToggle(value: boolean): void {
    this.themeService.setDarkMode(value);
  }

  onLanguageChange(language: AppLanguage): void {
    this.i18nService.setLanguage(language);
  }
}
