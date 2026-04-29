import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { I18nService } from './i18n.service';

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(
    private readonly messageService: MessageService,
    private readonly i18nService: I18nService
  ) {}

  success(summary: string, detail?: string): void {
    this.messageService.add({ severity: 'success', summary: this.i18nService.t(summary), detail: this.i18nService.t(detail), life: 3000 });
  }

  error(summary: string, detail?: string): void {
    this.messageService.add({ severity: 'error', summary: this.i18nService.t(summary), detail: this.i18nService.t(detail), life: 3000 });
  }

  info(summary: string, detail?: string): void {
    this.messageService.add({ severity: 'info', summary: this.i18nService.t(summary), detail: this.i18nService.t(detail), life: 3000 });
  }
}
