import { Component } from '@angular/core';
import { LoadingService } from './core/services/loading.service';
import { ThemeService } from './core/services/theme.service';
import { ToastMessage, ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(
    private readonly themeService: ThemeService,
    private readonly loadingService: LoadingService,
    private readonly toastService: ToastService
  ) {
    void this.themeService;
  }

  get isLoading(): boolean {
    return this.loadingService.isLoading();
  }

  get toasts(): ToastMessage[] {
    return this.toastService.messages();
  }

  removeToast(id: number): void {
    this.toastService.remove(id);
  }
}
