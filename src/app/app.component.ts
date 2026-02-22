import { Component } from '@angular/core';
import { LoadingService } from './core/services/loading.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(
    private readonly themeService: ThemeService,
    private readonly loadingService: LoadingService
  ) {
    void this.themeService;
  }

  get isLoading(): boolean {
    return this.loadingService.isLoading();
  }

}
