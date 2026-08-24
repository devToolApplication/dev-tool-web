import type {
  AfterViewInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import type { OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import type { Subscription } from 'rxjs';

export type DrawerSize = 'sm' | 'md' | 'comfortable' | 'lg' | 'xl' | 'full';
export type DrawerSide = 'left' | 'right';

export interface DrawerConfig {
  title?: string;
  subtitle?: string;
  size?: DrawerSize;
  side?: DrawerSide;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

@Component({
  selector: 'app-drawer',
  standalone: false,
  templateUrl: './drawer.component.html',
  styleUrl: './drawer.component.css',
})
export class DrawerComponent implements OnChanges, OnDestroy, AfterViewInit {
  private readonly overlayService = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);

  @ViewChild('drawerTemplate') drawerTemplate?: TemplateRef<unknown>;

  @Input() open = false;
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() size: DrawerSize = 'md';
  @Input() side: DrawerSide = 'right';
  @Input() closeOnBackdrop = true;
  @Input() closeOnEsc = true;
  @Input() loading = false;
  @Input() error?: string | null;
  @Input() empty = false;
  @Input() emptyTitle = 'shared.empty.title';
  @Input() emptyDescription?: string;

  @Output() openChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();

  private triggerElement: HTMLElement | null = null;
  private overlayRef?: OverlayRef;
  private overlayKeydownSubscription?: Subscription;
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.syncOverlay();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      if (this.open) {
        this.triggerElement =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
      } else {
        this.detachOverlay();
        this.restoreFocus();
      }
      this.syncOverlay();
    }
  }

  ngOnDestroy(): void {
    this.overlayKeydownSubscription?.unsubscribe();
    this.overlayRef?.dispose();
  }

  close(): void {
    if (this.loading) {
      return;
    }

    this.open = false;
    this.openChange.emit(false);
    this.closed.emit();
    this.detachOverlay();
    this.restoreFocus();
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.close();
    }
  }

  private syncOverlay(): void {
    if (!this.viewReady || !this.drawerTemplate) {
      return;
    }

    if (!this.open) {
      this.detachOverlay();
      return;
    }

    const overlayRef = this.ensureOverlay();
    if (!overlayRef.hasAttached()) {
      overlayRef.attach(new TemplatePortal(this.drawerTemplate, this.viewContainerRef));
    }
  }

  private ensureOverlay(): OverlayRef {
    if (this.overlayRef) {
      return this.overlayRef;
    }

    this.overlayRef = this.overlayService.create({
      positionStrategy: this.overlayService.position().global().top('0').left('0'),
      scrollStrategy: this.overlayService.scrollStrategies.block(),
      hasBackdrop: false,
    });
    this.overlayKeydownSubscription = this.overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape' && this.closeOnEsc && !this.loading) {
        event.preventDefault();
        this.close();
      }
    });
    return this.overlayRef;
  }

  private detachOverlay(): void {
    this.overlayRef?.detach();
  }

  private restoreFocus(): void {
    this.triggerElement?.focus();
    this.triggerElement = null;
  }
}
