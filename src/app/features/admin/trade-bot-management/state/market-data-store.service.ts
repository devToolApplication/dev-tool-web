import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MarketDataStoreService {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal('candles');
  readonly filters = signal<Record<string, unknown>>({});
  readonly rows = signal<unknown[]>([]);
}
