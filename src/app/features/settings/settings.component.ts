import { Component } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  constructor(private readonly themeService: ThemeService) {}

  get darkModeEnabled(): boolean {
    return this.themeService.isDarkMode;
  }

  onDarkModeToggle(value: boolean): void {
    this.themeService.setDarkMode(value);
  }
}
