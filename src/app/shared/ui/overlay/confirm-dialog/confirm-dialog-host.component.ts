import { Component, DestroyRef, ElementRef, HostListener, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmDialogRequest, ConfirmDialogService } from './confirm-dialog.service';
import { I18nService } from '../../../../core/ui-services/i18n.service';

@Component({
  selector: 'app-confirm-dialog-host',
  standalone: false,
  templateUrl: './confirm-dialog-host.component.html',
  styleUrl: './confirm-dialog-host.component.css'
})
export class ConfirmDialogHostComponent {
  @ViewChild('panel') panel?: ElementRef<HTMLElement>;

  readonly request = signal<ConfirmDialogRequest | null>(null);
  readonly typedText = signal('');
  readonly processing = signal(false);
  readonly actionError = signal<string | null>(null);
  private triggerElement: HTMLElement | null = null;

  constructor(
    private readonly confirmDialogService: ConfirmDialogService,
    private readonly i18nService: I18nService,
    private readonly destroyRef: DestroyRef
  ) {
    this.confirmDialogService.requests$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((request) => {
        this.triggerElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        this.typedText.set('');
        this.processing.set(false);
        this.actionError.set(null);
        this.request.set(request);
        setTimeout(() => this.focusInitialElement());
      });
  }

  get confirmDisabled(): boolean {
    if (this.processing()) {
      return true;
    }
    const request = this.request();
    if (!request?.requireText) {
      return false;
    }
    return this.typedText().trim() !== request.requireText;
  }

  requireTextHint(request: ConfirmDialogRequest): string {
    return this.i18nService.t('shared.confirm.requireText').replace('{{value}}', request.requireText ?? '');
  }

  severity(request: ConfirmDialogRequest): 'secondary' | 'info' | 'warn' | 'danger' {
    switch (request.variant) {
      case 'warning':
        return 'warn';
      case 'danger':
        return 'danger';
      case 'info':
        return 'info';
      case 'default':
      default:
        return 'secondary';
    }
  }

  async accept(): Promise<void> {
    const request = this.request();
    if (!request || this.confirmDisabled) {
      return;
    }

    if (request.action) {
      this.processing.set(true);
      this.actionError.set(null);
      try {
        await request.action();
      } catch {
        this.actionError.set(request.errorMessage);
        this.processing.set(false);
        return;
      }
    }

    this.close('confirmed');
  }

  reject(): void {
    if (this.processing()) {
      return;
    }
    this.close('cancelled');
  }

  onBackdropClick(): void {
    const request = this.request();
    if (request?.closeOnBackdrop && !this.processing()) {
      this.close('dismissed');
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    const request = this.request();
    if (request?.closeOnEsc && !this.processing()) {
      this.close('dismissed');
    }
  }

  @HostListener('document:keydown.tab', ['$event'])
  onTab(event: Event): void {
    if (!this.request()) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    const focusable = this.focusableElements();
    if (!focusable.length) {
      keyboardEvent.preventDefault();
      this.panel?.nativeElement.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (keyboardEvent.shiftKey && active === first) {
      keyboardEvent.preventDefault();
      last.focus();
    } else if (!keyboardEvent.shiftKey && active === last) {
      keyboardEvent.preventDefault();
      first.focus();
    }
  }

  private close(result: 'confirmed' | 'cancelled' | 'dismissed'): void {
    const request = this.request();
    if (!request) {
      return;
    }
    this.processing.set(false);
    this.actionError.set(null);
    this.request.set(null);
    request.resolve(result === 'confirmed');
    request.resolveResult?.(result);
    this.triggerElement?.focus();
    this.triggerElement = null;
  }

  private focusInitialElement(): void {
    const focusable = this.focusableElements();
    (focusable[0] ?? this.panel?.nativeElement)?.focus();
  }

  private focusableElements(): HTMLElement[] {
    const panel = this.panel?.nativeElement;
    if (!panel) {
      return [];
    }

    return Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.hasAttribute('disabled'));
  }
}
