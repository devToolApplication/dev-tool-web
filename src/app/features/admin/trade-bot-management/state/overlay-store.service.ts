import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OverlayStoreService {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly sourceType = signal('MARKET_DATA');
  readonly selectedOverlayCodes = signal<string[]>([]);
  readonly metadata = signal<Record<string, unknown> | null>(null);
  readonly overlays = signal<Record<string, unknown>>({});
}
