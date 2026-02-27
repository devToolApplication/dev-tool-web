import { Component } from '@angular/core';
import { ThemeMode, ThemeService } from '../../core/ui-services/theme.service';
import { ThemePresetId } from '../../core/ui-services/theme-presets';
import { AppLanguage, I18nService } from '../../core/ui-services/i18n.service';
import { ThemeCustomToken, ThemeCustomizerService } from '../../core/ui-services/theme-customizer.service';

@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  activeTab = 'general';
  customThemeMode: ThemeMode = 'light';

  constructor(
    private readonly themeService: ThemeService,
    private readonly i18nService: I18nService,
    private readonly themeCustomizerService: ThemeCustomizerService
  ) {}

  get darkModeEnabled(): boolean {
    return this.themeService.isDarkMode;
  }

  get themeMode(): ThemeMode {
    return this.themeService.themeMode;
  }

  get themeModeOptions(): { label: string; value: ThemeMode }[] {
    return [
      { label: this.i18nService.t('settings.theme.mode.light'), value: 'light' },
      { label: this.i18nService.t('settings.theme.mode.dark'), value: 'dark' }
    ];
  }

  get themePreset(): ThemePresetId {
    return this.themeService.themePreset;
  }

  get themePresetOptions(): { label: string; value: ThemePresetId }[] {
    return this.themeService.availablePresets.map((preset) => ({
      label: this.i18nService.t(`settings.theme.preset.${preset}`),
      value: preset
    }));
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

  get customModeOptions(): { label: string; value: ThemeMode }[] {
    return [
      { label: this.i18nService.t('settings.theme.mode.light'), value: 'light' },
      { label: this.i18nService.t('settings.theme.mode.dark'), value: 'dark' }
    ];
  }

  get themeTokenOptions(): Record<ThemeCustomToken, { label: string; value: string }[]> {
    return {
      selectBackground: this.themeCustomizerService.getOptions('selectBackground'),
      selectText: this.themeCustomizerService.getOptions('selectText'),
      inputBackground: this.themeCustomizerService.getOptions('inputBackground'),
      inputText: this.themeCustomizerService.getOptions('inputText'),
      appText: this.themeCustomizerService.getOptions('appText')
    };
  }

  get themeTokenValue(): Record<ThemeCustomToken, string> {
    return this.themeCustomizerService.getModeState(this.customThemeMode);
  }

  t(key:
    | 'settings.title'
    | 'settings.description'
    | 'settings.darkMode.title'
    | 'settings.darkMode.description'
    | 'settings.theme.mode.title'
    | 'settings.theme.mode.description'
    | 'settings.theme.preset.title'
    | 'settings.theme.preset.description'
    | 'settings.theme.mode.light'
    | 'settings.theme.mode.dark'
    | 'settings.theme.preset.aura'
    | 'settings.theme.preset.lara'
    | 'settings.theme.preset.nora'
    | 'settings.theme.preset.material'
    | 'settings.language.title'
    | 'settings.language.description'
    | 'settings.tabs.general'
    | 'settings.tabs.theme'
    | 'settings.theme.custom.title'
    | 'settings.theme.custom.description'
    | 'settings.theme.custom.mode'
    | 'settings.theme.custom.selectBackground'
    | 'settings.theme.custom.selectText'
    | 'settings.theme.custom.inputBackground'
    | 'settings.theme.custom.inputText'
    | 'settings.theme.custom.appText'
    | 'settings.theme.custom.customValue'
    | 'settings.theme.custom.reset'): string {
    return this.i18nService.t(key);
  }

  onTabChange(value: string | number | undefined): void {
    this.activeTab = typeof value === 'string' ? value : 'general';
  }

  onDarkModeToggle(value: boolean): void {
    this.themeService.setDarkMode(value);
  }

  onThemeModeChange(mode: string | number | boolean | null): void {
    if (mode === 'light' || mode === 'dark') {
      this.themeService.setThemeMode(mode);
    }
  }

  onThemePresetChange(preset: string | number | boolean | null): void {
    if (preset === 'aura' || preset === 'lara' || preset === 'nora' || preset === 'material') {
      this.themeService.setThemePreset(preset);
    }
  }

  onLanguageChange(language: string | number | boolean | null): void {
    if (language === 'vi' || language === 'en') {
      this.i18nService.setLanguage(language);
    }
  }

  onCustomModeChange(mode: string | number | boolean | null): void {
    if (mode === 'light' || mode === 'dark') {
      this.customThemeMode = mode;
    }
  }

  onThemeTokenChange(token: ThemeCustomToken, value: string | number | boolean | null): void {
    if (typeof value === 'string') {
      this.themeCustomizerService.set(this.customThemeMode, token, value);
    }
  }

  onThemeTokenManualInput(token: ThemeCustomToken, value: string): void {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      this.themeCustomizerService.set(this.customThemeMode, token, trimmed);
    }
  }

  onResetThemeConfig(): void {
    this.themeCustomizerService.reset(this.customThemeMode);
  }
}
