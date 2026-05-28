import { Injectable } from '@angular/core';

const THEME_MODE_STORAGE_KEY = 'app-theme-mode';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly root = document.documentElement;
  private readonly mediaQuery =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;
  private mode: ThemeMode = 'light';

  constructor() {
    this.applySavedTheme();
    this.watchSystemTheme();
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
    this.root.dataset['theme'] = mode;
    localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
  }

  toggleDarkMode(): void {
    this.setDarkMode(!this.isDarkMode);
  }

  private applySavedTheme(): void {
    const savedMode = localStorage.getItem(THEME_MODE_STORAGE_KEY) as ThemeMode | null;
    this.mode = this.resolveInitialThemeMode(savedMode);
    this.root.dataset['theme'] = this.mode;
  }

  private resolveInitialThemeMode(savedMode: ThemeMode | null): ThemeMode {
    if (this.mediaQuery) {
      return this.mediaQuery.matches ? 'dark' : 'light';
    }
    return savedMode === 'dark' ? 'dark' : 'light';
  }

  private watchSystemTheme(): void {
    if (!this.mediaQuery) {
      return;
    }

    const syncThemeWithSystem = (matches: boolean): void => {
      this.mode = matches ? 'dark' : 'light';
      this.root.dataset['theme'] = this.mode;
    };

    if (typeof this.mediaQuery.addEventListener === 'function') {
      this.mediaQuery.addEventListener('change', (event) => syncThemeWithSystem(event.matches));
      return;
    }

    this.mediaQuery.addListener((query) => syncThemeWithSystem(query.matches));
  }
}
