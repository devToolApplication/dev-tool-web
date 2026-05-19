import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export type ErrorStateVariant = 'danger' | 'warning' | 'info';

export interface ErrorStateConfig {
  title?: string;
  message?: string;
  errorCode?: string;
  detail?: unknown;
  retryLabel?: string;
  showCopyDetail?: boolean;
  variant?: ErrorStateVariant;
}

const DEFAULT_ERROR_MESSAGE = 'shared.error.message';

@Component({
  selector: 'app-error-state',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './error-state.component.html',
  styleUrl: './error-state.component.css'
})
export class ErrorStateComponent {
  @Input() title = 'shared.error.title';
  @Input() message = DEFAULT_ERROR_MESSAGE;
  @Input() error?: unknown;
  @Input() errorCode?: string;
  @Input() detail?: unknown;
  @Input() retryLabel?: string;
  @Input() showCopyDetail = false;
  @Input() compact = false;
  @Input() variant: ErrorStateVariant = 'danger';

  @Output() retry = new EventEmitter<void>();
  @Output() copyDetail = new EventEmitter<string>();

  get hasDetail(): boolean {
    return this.detailSource != null;
  }

  get detailText(): string {
    const detail = this.detailSource;
    if (detail == null) {
      return '';
    }
    if (typeof detail === 'string') {
      return detail;
    }
    try {
      return JSON.stringify(detail, null, 2);
    } catch {
      return String(detail);
    }
  }

  get resolvedVariant(): ErrorStateVariant {
    return ['danger', 'warning', 'info'].includes(this.variant) ? this.variant : 'danger';
  }

  get resolvedIcon(): string {
    switch (this.resolvedVariant) {
      case 'warning':
        return 'pi pi-exclamation-triangle';
      case 'info':
        return 'pi pi-info-circle';
      case 'danger':
      default:
        return 'pi pi-times-circle';
    }
  }

  get resolvedMessage(): string {
    if (this.message !== DEFAULT_ERROR_MESSAGE || this.error == null) {
      return this.message;
    }
    if (typeof this.error === 'string') {
      return this.error;
    }
    if (typeof this.error === 'object' && this.error) {
      const message = (this.error as { message?: unknown }).message;
      return typeof message === 'string' && message.trim() ? message : DEFAULT_ERROR_MESSAGE;
    }
    return DEFAULT_ERROR_MESSAGE;
  }

  async onCopyDetail(): Promise<void> {
    const text = this.detailText;
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      this.fallbackCopy(text);
    }
    this.copyDetail.emit(text);
  }

  private fallbackCopy(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  private get detailSource(): unknown {
    return this.detail ?? (typeof this.error === 'object' ? this.error : null);
  }
}
