import { Component, EventEmitter, Input, Output } from '@angular/core';

type PopupSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-base-popup',
  standalone: false,
  styles: [`
    :host { display: contents; }
  `],
  template: `
    @if (visible) {
      <div class="fixed inset-0 z-[2400] flex items-center justify-center" [class]="maskStyleClass"
        [ngClass]="{
          'items-start pt-8': position === 'top',
          'items-end pb-8': position === 'bottom'
        }"
      >
        @if (modal) {
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="dismissableMask ? onDismiss() : null"></div>
        }

        <div
          role="dialog"
          [attr.aria-label]="resolvedAriaLabel"
          [attr.aria-modal]="modal"
          class="relative z-10 flex max-h-[90vh] flex-col rounded-2xl border border-[var(--app-border-strong)] bg-[var(--app-overlay-bg)] shadow-2xl backdrop-blur-lg animate-[app-dialog-in_200ms_ease-out]"
          [class]="resolvedStyleClass"
          [style.width]="popupWidth"
          (keydown.escape)="closeOnEscape ? onDismiss() : null"
        >
          <!-- Header -->
          <header class="flex items-center justify-between gap-3 border-b border-[var(--app-border-soft)] px-5 py-3.5">
            <div class="min-w-0 flex-1">
              <ng-content select="[popup-header]"></ng-content>
              @if (!hasProjectedHeader) {
                <div class="flex flex-col gap-0.5">
                  <span class="text-lg font-semibold text-[var(--app-text)]">{{ header | translateContent }}</span>
                  @if (subheader) {
                    <small class="text-[var(--app-text-muted)]">{{ subheader | translateContent }}</small>
                  }
                </div>
              }
            </div>
            <div class="flex items-center gap-2">
              @if (loading) {
                <span class="inline-flex items-center gap-1 rounded-full bg-[var(--app-control-info-bg)] px-2 py-0.5 text-xs text-[var(--app-control-info-text)] border border-[var(--app-control-info-border)]">
                  <i class="pi pi-spinner pi-spin text-[0.6rem]"></i> loading
                </span>
              }
              @if (maximizable) {
                <button type="button" class="rounded-md p-1.5 text-[var(--app-text-muted)] border border-[var(--app-border-soft)] bg-[var(--app-surface-soft)] hover:bg-[var(--app-surface-alt)] hover:text-[var(--app-text)] transition-colors" (click)="maximized = !maximized">
                  <i [class]="maximized ? 'pi pi-window-minimize' : 'pi pi-window-maximize'" class="text-sm"></i>
                </button>
              }
              @if (showCloseIcon) {
                <button type="button" class="rounded-md p-1.5 text-[var(--app-text-muted)] border border-[var(--app-border-soft)] bg-[var(--app-surface-soft)] hover:bg-[var(--app-surface-alt)] hover:text-[var(--app-text)] transition-colors" aria-label="Close" (click)="onDismiss()">
                  <i class="pi pi-times text-sm"></i>
                </button>
              }
            </div>
          </header>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto px-5 py-4">
            <div class="flex flex-col gap-4">
              <ng-content></ng-content>
            </div>
          </div>

          <!-- Footer -->
          @if (showFooter) {
            <footer class="flex items-center justify-between gap-3 border-t border-[var(--app-border-soft)] px-5 py-3.5">
              <ng-content select="[popup-footer-start]"></ng-content>
              <div class="flex items-center gap-2 ml-auto">
                @if (showDefaultCancel) {
                  <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-[var(--app-text-soft)] hover:text-[var(--app-primary)] hover:bg-[var(--app-chart-primary-fill)] transition-all" [disabled]="loading" (click)="cancel.emit()">
                    {{ cancelLabel | translateContent }}
                  </button>
                }
                @if (showDefaultConfirm) {
                  <button type="button" class="rounded-lg bg-[var(--app-primary)] px-4 py-2 text-sm font-medium text-white hover:brightness-110 transition-all disabled:opacity-60" [disabled]="loading" (click)="confirm.emit()">
                    @if (loading) { <i class="pi pi-spinner pi-spin mr-1"></i> }
                    {{ confirmLabel | translateContent }}
                  </button>
                }
                <ng-content select="[popup-footer]"></ng-content>
              </div>
            </footer>
          }
        </div>
      </div>
    }
  `
})
export class BasePopupComponent {
  @Input() visible = false;
  @Input() header = '';
  @Input() subheader = '';
  @Input() size: PopupSize = 'md';
  @Input() width?: string;
  @Input() loading = false;
  @Input() modal = true;
  @Input() appendTo: HTMLElement | 'body' | null = 'body';
  @Input() baseZIndex = 2400;
  @Input() maskStyleClass = '';
  @Input() position: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright' = 'center';
  @Input() dismissableMask = false;
  @Input() closeOnEscape = true;
  @Input() maximizable = false;
  @Input() showCloseIcon = true;
  @Input() showFooter = true;
  @Input() styleClass = '';
  @Input() confirmLabel = 'submit';
  @Input() cancelLabel = 'cancel';
  @Input() showDefaultCancel = true;
  @Input() showDefaultConfirm = false;
  @Input() hasProjectedHeader = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() hide = new EventEmitter<void>();

  maximized = false;

  get resolvedAriaLabel(): string {
    return this.header || this.subheader || 'dialog';
  }

  get sizeClass(): string {
    return `base-popup--${this.size}`;
  }

  get resolvedStyleClass(): string {
    const classes = [this.sizeClass, this.styleClass].filter(Boolean).join(' ');
    if (this.maximized) return classes + ' !w-[96vw] !max-h-[96vh]';
    return classes;
  }

  get popupWidth(): string {
    if (this.maximized) return '96vw';
    if (this.width) return this.width;
    switch (this.size) {
      case 'sm': return '28rem';
      case 'lg': return '58rem';
      case 'xl': return '78rem';
      case 'md':
      default: return '42rem';
    }
  }

  onDismiss(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cancel.emit();
    this.hide.emit();
  }
}
