import { Injectable, signal } from '@angular/core';

export type ToastSeverity = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  summary: string;
  detail?: string;
  severity: ToastSeverity;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly messages = signal<ToastMessage[]>([]);

  success(summary: string, detail?: string): void {
    this.push('success', summary, detail);
  }

  error(summary: string, detail?: string): void {
    this.push('error', summary, detail);
  }

  info(summary: string, detail?: string): void {
    this.push('info', summary, detail);
  }

  remove(id: number): void {
    this.messages.update((items) => items.filter((item) => item.id !== id));
  }

  private push(severity: ToastSeverity, summary: string, detail?: string): void {
    const message: ToastMessage = { id: this.nextId++, severity, summary, detail };
    this.messages.update((items) => [...items, message]);
    setTimeout(() => this.remove(message.id), 3000);
  }
}
