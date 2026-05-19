import { Component, WritableSignal, computed, signal } from '@angular/core';
import { ThemeMode, ThemeService } from '../../core/ui-services/theme.service';
import { ThemePresetId } from '../../core/ui-services/theme-presets';
import { AppLanguage, I18nService } from '../../core/ui-services/i18n.service';
import {
  ThemeCustomOption,
  ThemeCustomToken,
  ThemeCustomizerService
} from '../../core/ui-services/theme-customizer.service';

type SettingsTab = 'general' | 'theme';
type SettingsOptionValue = string | number | boolean | null;

interface SettingsOption<T extends SettingsOptionValue = SettingsOptionValue> {
  label: string;
  value: T;
}

interface SettingsSummaryItem {
  icon: string;
  label: string;
  value: string;
}

interface SettingsPanel {
  icon: string;
  title: string;
  description: string;
}

interface ThemeTokenField {
  token: ThemeCustomToken;
  label: string;
  description: string;
}

@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  readonly activeTab = signal<SettingsTab>('general');
  readonly customThemeMode = signal<ThemeMode>('light');
  readonly themeMode: WritableSignal<ThemeMode>;
  readonly themePreset: WritableSignal<ThemePresetId>;
  readonly language: I18nService['language'];

  private readonly themeConfigRevision = signal(0);

  readonly tabItems: SettingsOption<SettingsTab>[] = [
    { value: 'general', label: 'settings.tab.general' },
    { value: 'theme', label: 'settings.tab.theme' }
  ];

  readonly themeModeOptions: SettingsOption<ThemeMode>[] = [
    { label: 'light', value: 'light' },
    { label: 'dark', value: 'dark' }
  ];

  readonly customModeOptions = this.themeModeOptions;

  readonly languageOptions: SettingsOption<AppLanguage>[] = [
    { label: 'vietnamese', value: 'vi' },
    { label: 'english', value: 'en' }
  ];

  readonly themePresetOptions: SettingsOption<ThemePresetId>[];

  readonly generalPanels: SettingsPanel[] = [
    {
      icon: 'pi pi-moon',
      title: 'settings.darkModeTitle',
      description: 'settings.darkModeDescription'
    },
    {
      icon: 'pi pi-desktop',
      title: 'settings.themeModeTitle',
      description: 'settings.themeModeDescription'
    },
    {
      icon: 'pi pi-palette',
      title: 'settings.themePresetTitle',
      description: 'settings.themePresetDescription'
    },
    {
      icon: 'pi pi-language',
      title: 'settings.languageTitle',
      description: 'settings.languageDescription'
    }
  ];

  readonly themeTokenFields: ThemeTokenField[] = [
    { token: 'primary', label: 'settings.primary', description: 'settings.primaryDescription' },
    { token: 'surface', label: 'settings.surface', description: 'settings.surfaceDescription' },
    { token: 'border', label: 'settings.border', description: 'settings.borderDescription' },
    { token: 'successText', label: 'settings.successText', description: 'settings.successTextDescription' },
    { token: 'dangerText', label: 'settings.dangerText', description: 'settings.dangerTextDescription' },
    {
      token: 'selectBackground',
      label: 'settings.selectBackground',
      description: 'settings.selectBackgroundDescription'
    },
    { token: 'selectText', label: 'settings.selectText', description: 'settings.selectTextDescription' },
    {
      token: 'inputBackground',
      label: 'settings.inputBackground',
      description: 'settings.inputBackgroundDescription'
    },
    { token: 'inputText', label: 'settings.inputText', description: 'settings.inputTextDescription' },
    { token: 'appText', label: 'settings.appText', description: 'settings.appTextDescription' }
  ];

  readonly settingsSummary = computed<SettingsSummaryItem[]>(() => [
    {
      icon: this.themeMode() === 'dark' ? 'pi pi-moon' : 'pi pi-sun',
      label: 'settings.summary.themeMode',
      value: this.themeMode()
    },
    {
      icon: 'pi pi-palette',
      label: 'settings.summary.preset',
      value: `settings.${this.themePreset()}`
    },
    {
      icon: 'pi pi-language',
      label: 'settings.summary.language',
      value: this.language() === 'vi' ? 'vietnamese' : 'english'
    },
    {
      icon: 'pi pi-sliders-h',
      label: 'settings.summary.customMode',
      value: this.customThemeMode()
    }
  ]);

  readonly themeTokenOptions = computed<Record<ThemeCustomToken, SettingsOption<string>[]>>(() => {
    this.themeConfigRevision();
    return this.themeTokenFields.reduce<Record<ThemeCustomToken, SettingsOption<string>[]>>(
      (options, field) => ({
        ...options,
        [field.token]: this.themeCustomizerService.getOptions(field.token).map((option) => this.mapThemeOption(option))
      }),
      {} as Record<ThemeCustomToken, SettingsOption<string>[]>
    );
  });

  readonly themeTokenValue = computed(() => {
    this.themeConfigRevision();
    return this.themeCustomizerService.getModeState(this.customThemeMode());
  });

  constructor(
    private readonly themeService: ThemeService,
    private readonly i18nService: I18nService,
    private readonly themeCustomizerService: ThemeCustomizerService
  ) {
    this.themeMode = signal<ThemeMode>(this.themeService.themeMode);
    this.themePreset = signal<ThemePresetId>(this.themeService.themePreset);
    this.language = this.i18nService.language;
    this.themePresetOptions = this.themeService.availablePresets.map((preset) => ({
      label: `settings.${preset}`,
      value: preset
    }));
  }

  onTabChange(value: string | number | undefined): void {
    this.activeTab.set(isSettingsTab(value) ? value : 'general');
  }

  onDarkModeToggle(value: boolean): void {
    const mode: ThemeMode = value ? 'dark' : 'light';
    this.themeService.setDarkMode(value);
    this.themeMode.set(mode);
  }

  onThemeModeChange(mode: string | number | boolean | null): void {
    if (isThemeMode(mode)) {
      this.themeService.setThemeMode(mode);
      this.themeMode.set(mode);
    }
  }

  onThemePresetChange(preset: string | number | boolean | null): void {
    if (isThemePreset(preset)) {
      this.themeService.setThemePreset(preset);
      this.themePreset.set(preset);
    }
  }

  onLanguageChange(language: string | number | boolean | null): void {
    if (isLanguage(language)) {
      this.i18nService.setLanguage(language);
    }
  }

  onCustomModeChange(mode: string | number | boolean | null): void {
    if (isThemeMode(mode)) {
      this.customThemeMode.set(mode);
    }
  }

  onThemeTokenChange(token: ThemeCustomToken, value: string | number | boolean | null): void {
    if (typeof value === 'string') {
      this.themeCustomizerService.set(this.customThemeMode(), token, value);
      this.bumpThemeRevision();
    }
  }

  onThemeTokenManualInput(token: ThemeCustomToken, value: string): void {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      this.themeCustomizerService.set(this.customThemeMode(), token, trimmed);
      this.bumpThemeRevision();
    }
  }

  onResetThemeConfig(): void {
    this.themeCustomizerService.reset(this.customThemeMode());
    this.bumpThemeRevision();
  }

  private mapThemeOption(option: ThemeCustomOption): SettingsOption<string> {
    return {
      label: `settings.option.${option.label}`,
      value: option.value
    };
  }

  private bumpThemeRevision(): void {
    this.themeConfigRevision.update((revision) => revision + 1);
  }
}

function isSettingsTab(value: unknown): value is SettingsTab {
  return value === 'general' || value === 'theme';
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

function isThemePreset(value: unknown): value is ThemePresetId {
  return value === 'aura' || value === 'lara' || value === 'nora' || value === 'material';
}

function isLanguage(value: unknown): value is AppLanguage {
  return value === 'vi' || value === 'en';
}
