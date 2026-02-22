import { Injectable, computed, signal } from '@angular/core';
import { Observable, finalize } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly activeRequests = signal(0);
  readonly isLoading = computed(() => this.activeRequests() > 0);

  show(): void {
    this.activeRequests.update((value) => value + 1);
  }

  hide(): void {
    this.activeRequests.update((value) => Math.max(0, value - 1));
  }

  track<T>(source$: Observable<T>): Observable<T> {
    this.show();
    return source$.pipe(finalize(() => this.hide()));
  }
}
