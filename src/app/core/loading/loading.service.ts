import { Injectable, computed, signal } from '@angular/core';
import { Observable, defer, finalize } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly activeRequests = signal(0);
  private pendingRequestDelta = 0;
  private flushScheduled = false;
  readonly isLoading = computed(() => this.activeRequests() > 0);

  show(): void {
    this.enqueueRequestDelta(1);
  }

  hide(): void {
    this.enqueueRequestDelta(-1);
  }

  track<T>(source$: Observable<T>): Observable<T> {
    return defer(() => {
      this.show();
      return source$.pipe(finalize(() => this.hide()));
    });
  }

  private enqueueRequestDelta(delta: number): void {
    this.pendingRequestDelta += delta;

    if (this.flushScheduled) {
      return;
    }

    this.flushScheduled = true;
    this.scheduleFlush(() => this.flushRequestDelta());
  }

  private flushRequestDelta(): void {
    this.flushScheduled = false;

    const delta = this.pendingRequestDelta;
    this.pendingRequestDelta = 0;

    if (delta === 0) {
      return;
    }

    this.activeRequests.update((value) => Math.max(0, value + delta));
  }

  private scheduleFlush(callback: () => void): void {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(callback);
      return;
    }

    void Promise.resolve().then(callback);
  }
}
