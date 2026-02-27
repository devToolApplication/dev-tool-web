import { Injectable } from '@angular/core';
import { usePreset } from '@primeuix/themes';
import { APP_THEME_PRESETS, ThemePresetId } from './theme-presets';

const THEME_MODE_STORAGE_KEY = 'app-theme-mode';
const THEME_PRESET_STORAGE_KEY = 'app-theme-preset';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly root = document.documentElement;
  private mode: ThemeMode = 'light';
  private preset: ThemePresetId = 'aura';

  constructor() {
    this.applySavedTheme();
  }

  get isDarkMode(): boolean {
    return this.mode === 'dark';
  }

  setDarkMode(enabled: boolean): void {
    this.setThemeMode(enabled ? 'dark' : 'light');
  }

  get themeMode(): ThemeMode {
    return this.mode;
  }

  setThemeMode(mode: ThemeMode): void {
    this.mode = mode;
    this.root.classList.toggle('app-dark', mode === 'dark');
    localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
  }

  toggleDarkMode(): void {
    this.setDarkMode(!this.isDarkMode);
  }

  get themePreset(): ThemePresetId {
    return this.preset;
  }

  get availablePresets(): ThemePresetId[] {
    return Object.keys(APP_THEME_PRESETS) as ThemePresetId[];
  }

  setThemePreset(preset: ThemePresetId): void {
    this.preset = preset;
    usePreset(APP_THEME_PRESETS[preset]);
    localStorage.setItem(THEME_PRESET_STORAGE_KEY, preset);
  }

  private applySavedTheme(): void {
    const savedPreset = localStorage.getItem(THEME_PRESET_STORAGE_KEY) as ThemePresetId | null;
    this.setThemePreset(savedPreset && savedPreset in APP_THEME_PRESETS ? savedPreset : 'aura');

    const savedMode = localStorage.getItem(THEME_MODE_STORAGE_KEY) as ThemeMode | null;
    this.setThemeMode(savedMode === 'dark' ? 'dark' : 'light');
  }
}
