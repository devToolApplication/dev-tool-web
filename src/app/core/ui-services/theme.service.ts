import { Injectable } from '@angular/core';

const THEME_STORAGE_KEY = 'app-theme';
type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly root = document.documentElement;
  private readonly darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    this.applySavedTheme();

    this.darkModeMedia.addEventListener('change', () => {
      if (!this.hasStoredPreference()) {
        this.setDarkMode(this.darkModeMedia.matches, false);
      }
    });
  }

  get isDarkMode(): boolean {
    return this.root.classList.contains('app-dark');
  }

  setDarkMode(enabled: boolean, persist = true): void {
    this.root.classList.toggle('app-dark', enabled);
    this.root.style.colorScheme = enabled ? 'dark' : 'light';

    if (persist) {
      localStorage.setItem(THEME_STORAGE_KEY, enabled ? 'dark' : 'light');
    }
  }

  toggleDarkMode(): void {
    this.setDarkMode(!this.isDarkMode);
  }

  private applySavedTheme(): void {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (savedTheme === 'dark' || savedTheme === 'light') {
      this.setDarkMode(savedTheme === 'dark', false);
      return;
    }

    this.setDarkMode(this.darkModeMedia.matches, false);
  }

  private hasStoredPreference(): boolean {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === 'dark' || savedTheme === 'light';
  }
}
