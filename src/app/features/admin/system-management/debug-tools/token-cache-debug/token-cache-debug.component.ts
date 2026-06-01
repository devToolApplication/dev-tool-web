import { Component } from '@angular/core';
import { finalize } from 'rxjs';
import { TokenCacheService, TokenCacheTarget } from '../../../../../core/services/ai-agent-service/token-cache.service';
import { ToastService } from '../../../../../core/ui-services/toast.service';

@Component({
  selector: 'app-token-cache-debug',
  standalone: false,
  templateUrl: './token-cache-debug.component.html',
  styleUrl: './token-cache-debug.component.css'
})
export class TokenCacheDebugComponent {
  targets: TokenCacheTarget[] = [];
  clearingAll = false;
  clearingTarget: string | null = null;

  constructor(
    private readonly tokenCacheService: TokenCacheService,
    private readonly toastService: ToastService
  ) {
    this.targets = this.tokenCacheService.getTargets();
  }

  clearSingle(target: TokenCacheTarget): void {
    this.clearingTarget = target.label;
    this.tokenCacheService
      .clearCache(target)
      .pipe(finalize(() => (this.clearingTarget = null)))
      .subscribe({
        next: () => this.toastService.info(`Token cache cleared: ${target.label}`),
        error: () => this.toastService.error(`Failed to clear token cache: ${target.label}`)
      });
  }

  clearAll(): void {
    this.clearingAll = true;
    this.tokenCacheService
      .clearAll()
      .pipe(finalize(() => (this.clearingAll = false)))
      .subscribe({
        next: () => this.toastService.info('All token caches cleared'),
        error: () => this.toastService.error('Failed to clear some token caches')
      });
  }
}
