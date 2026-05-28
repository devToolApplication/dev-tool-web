import { Injectable, signal } from '@angular/core';
import { I18nService } from './i18n.service';

type ToastSeverity = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  severity: ToastSeverity;
  summary: string;
  detail?: string;
  life: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly recentMessages = new Map<string, number>();
  private readonly dedupeWindowMs = 2500;
  private nextId = 0;

  readonly messages = signal<ToastMessage[]>([]);

  constructor(private readonly i18nService: I18nService) {}

  success(summary: string, detail?: string): void {
    this.show('success', summary, detail);
  }

  error(summary: string, detail?: string): void {
    this.show('error', summary, detail);
  }

  info(summary: string, detail?: string): void {
    this.show('info', summary, detail);
  }

  dismiss(id: number): void {
    this.messages.update(msgs => msgs.filter(m => m.id !== id));
  }

  private show(severity: ToastSeverity, summary: string, detail?: string): void {
    const translatedSummary = this.i18nService.t(summary);
    const translatedDetail = this.i18nService.t(detail);
    const dedupeKey = `${severity}:${translatedSummary}:${translatedDetail}`;

    if (this.isDuplicate(dedupeKey)) {
      return;
    }

    this.recentMessages.set(dedupeKey, Date.now());
    const life = 3000;
    const id = this.nextId++;
    const msg: ToastMessage = { id, severity, summary: translatedSummary, detail: translatedDetail, life };
    this.messages.update(msgs => [...msgs, msg]);

    setTimeout(() => this.dismiss(id), life);
  }

  private isDuplicate(dedupeKey: string): boolean {
    const now = Date.now();
    const lastShownAt = this.recentMessages.get(dedupeKey);

    for (const [key, shownAt] of this.recentMessages.entries()) {
      if (now - shownAt > this.dedupeWindowMs) {
        this.recentMessages.delete(key);
      }
    }

    return lastShownAt !== undefined && now - lastShownAt <= this.dedupeWindowMs;
  }
}
