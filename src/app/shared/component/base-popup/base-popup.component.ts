import { Component, EventEmitter, Input, Output } from '@angular/core';

type PopupSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-base-popup',
  standalone: false,
  styles: [`
    :host ::ng-deep .base-popup.p-dialog {
      border: 1px solid var(--app-border-strong);
      border-radius: 1.2rem;
      background:
        var(--app-card-highlight),
        var(--app-card-bg-strong);
      color: var(--app-text);
      box-shadow: var(--app-shadow-overlay);
      backdrop-filter: blur(18px);
      overflow: hidden;
    }

    :host ::ng-deep .base-popup .p-dialog-header,
    :host ::ng-deep .base-popup .p-dialog-content,
    :host ::ng-deep .base-popup .p-dialog-footer {
      background: var(--app-transparent);
      color: inherit;
    }

    :host ::ng-deep .base-popup .p-dialog-header {
      padding: 1.35rem 1.4rem 0.85rem;
      border-bottom: 1px solid var(--app-border-soft);
    }

    :host ::ng-deep .base-popup .p-dialog-content {
      padding: 1.1rem 1.4rem;
    }

    :host ::ng-deep .base-popup .p-dialog-footer {
      padding: 0.95rem 1.4rem 1.25rem;
      border-top: 1px solid var(--app-border-soft);
    }

    :host ::ng-deep .base-popup .p-dialog-header-icon {
      color: var(--app-text-muted);
      background: var(--app-surface-soft);
      border: 1px solid var(--app-border-soft);
    }

    :host ::ng-deep .base-popup .p-dialog-header-icon:hover {
      background: var(--app-surface-alt);
      color: var(--app-text);
    }
  `],
  template: `
    <p-dialog
      [visible]="visible"
      [modal]="modal"
      [appendTo]="appendTo"
      [position]="position"
      [maskStyleClass]="maskStyleClass"
      [dismissableMask]="dismissableMask"
      [closeOnEscape]="closeOnEscape"
      [draggable]="false"
      [resizable]="false"
      [maximizable]="maximizable"
      [closable]="showCloseIcon"
      [styleClass]="resolvedStyleClass"
      [style]="{ width: popupWidth }"
      (visibleChange)="onVisibleChange($event)"
      (onHide)="onHide()"
    >
      <ng-template pTemplate="header">
        <div class="flex w-full items-center justify-between gap-3">
          <div class="min-w-0 flex-1">
            <ng-content select="[popup-header]"></ng-content>
            @if (!hasProjectedHeader) {
              <div class="flex flex-col gap-1">
                <span class="text-lg font-semibold">{{ header | translateContent }}</span>
                <small *ngIf="subheader" class="app-text-muted">{{ subheader | translateContent }}</small>
              </div>
            }
          </div>
          <app-tag *ngIf="loading" [value]="'loading' | translateContent" severity="info"></app-tag>
        </div>
      </ng-template>

      <div class="flex flex-col gap-4">
        <ng-content></ng-content>
      </div>

      @if (showFooter) {
      <ng-template pTemplate="footer">
        <div class="flex items-center justify-between gap-3">
          <ng-content select="[popup-footer-start]"></ng-content>
          <div class="flex items-center gap-2">
            <button *ngIf="showDefaultCancel" pButton type="button" class="p-button-text" [disabled]="loading" (click)="cancel.emit()">{{ cancelLabel | translateContent }}</button>
            <button *ngIf="showDefaultConfirm" pButton type="button" [loading]="loading" (click)="confirm.emit()">{{ confirmLabel | translateContent }}</button>
            <ng-content select="[popup-footer]"></ng-content>
          </div>
        </div>
      </ng-template>
      }
    </p-dialog>
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
  @Input() appendTo: HTMLElement | 'body' | null = null;
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

  get sizeClass(): string {
    return `base-popup--${this.size}`;
  }

  get resolvedStyleClass(): string {
    return ['base-popup', this.sizeClass, this.styleClass].filter(Boolean).join(' ');
  }

  get popupWidth(): string {
    if (this.width) {
      return this.width;
    }
    switch (this.size) {
      case 'sm':
        return '28rem';
      case 'lg':
        return '58rem';
      case 'xl':
        return '78rem';
      case 'md':
      default:
        return '42rem';
    }
  }

  onVisibleChange(visible: boolean): void {
    this.visibleChange.emit(visible);
    if (!visible) {
      this.cancel.emit();
    }
  }

  onHide(): void {
    this.hide.emit();
  }
}
