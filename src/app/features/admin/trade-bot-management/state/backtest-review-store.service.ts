import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BacktestReviewStoreService {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal('summary');
  readonly selectedRunId = signal<string | null>(null);
  readonly review = signal<Record<string, unknown> | null>(null);
}
