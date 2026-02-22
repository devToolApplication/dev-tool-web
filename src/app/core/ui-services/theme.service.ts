import { Injectable } from '@angular/core';

const THEME_STORAGE_KEY = 'app-theme';
type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly root = document.documentElement;

  constructor() {
    this.applySavedTheme();
  }

  get isDarkMode(): boolean {
    return this.root.classList.contains('app-dark');
  }

  setDarkMode(enabled: boolean): void {
    this.root.classList.toggle('app-dark', enabled);
    localStorage.setItem(THEME_STORAGE_KEY, enabled ? 'dark' : 'light');
  }

  toggleDarkMode(): void {
    this.setDarkMode(!this.isDarkMode);
  }

  private applySavedTheme(): void {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    this.setDarkMode(savedTheme === 'dark');
  }
}
