import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { I18nService } from '../../../../core/ui-services/i18n.service';

export type ConfirmDialogVariant = 'default' | 'warning' | 'danger' | 'info';
export type ConfirmDialogResult = 'confirmed' | 'cancelled' | 'dismissed';

export interface ConfirmDialogConfig {
  title?: string;
  header?: string;
  message?: string;
  confirmText?: string;
  acceptLabel?: string;
  cancelText?: string;
  rejectLabel?: string;
  icon?: string;
  variant?: ConfirmDialogVariant;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  requireText?: string;
  action?: () => Promise<void> | void;
  errorMessage?: string;
}

export type ConfirmDialogOptions = ConfirmDialogConfig;

export interface ConfirmDialogRequest {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  icon: string;
  variant: ConfirmDialogVariant;
  closeOnBackdrop: boolean;
  closeOnEsc: boolean;
  requireText?: string;
  action?: () => Promise<void> | void;
  errorMessage: string;
  resolve: (confirmed: boolean) => void;
  resolveResult?: (result: ConfirmDialogResult) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly requestSubject = new Subject<ConfirmDialogRequest>();

  readonly requests$: Observable<ConfirmDialogRequest> = this.requestSubject.asObservable();

  constructor(private readonly i18nService: I18nService) {}

  confirm(options: ConfirmDialogConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this.openRequest(options, resolve);
    });
  }

  confirmResult(options: ConfirmDialogConfig): Promise<ConfirmDialogResult> {
    return new Promise((resolveResult) => {
      this.openRequest(options, undefined, resolveResult);
    });
  }

  private openRequest(
    options: ConfirmDialogConfig,
    resolve?: (confirmed: boolean) => void,
    resolveResult?: (result: ConfirmDialogResult) => void
  ): void {
      const variant = options.variant ?? 'danger';

      this.requestSubject.next({
        title: this.i18nService.t(options.title ?? options.header ?? 'confirm'),
        message: this.i18nService.t(options.message ?? 'shared.confirm.message'),
        confirmText: this.i18nService.t(options.confirmText ?? options.acceptLabel ?? 'yes'),
        cancelText: this.i18nService.t(options.cancelText ?? options.rejectLabel ?? 'no'),
        icon: options.icon ?? this.iconForVariant(variant),
        variant,
        closeOnBackdrop: options.closeOnBackdrop ?? true,
        closeOnEsc: options.closeOnEsc ?? true,
        requireText: options.requireText ? this.i18nService.t(options.requireText) : undefined,
        action: options.action,
        errorMessage: this.i18nService.t(options.errorMessage ?? 'shared.confirm.actionFailed'),
        resolve: resolve ?? (() => undefined),
        resolveResult
      });
  }

  private iconForVariant(variant: ConfirmDialogVariant): string {
    switch (variant) {
      case 'warning':
        return 'pi pi-exclamation-triangle';
      case 'danger':
        return 'pi pi-trash';
      case 'info':
        return 'pi pi-info-circle';
      case 'default':
      default:
        return 'pi pi-question-circle';
    }
  }
}
