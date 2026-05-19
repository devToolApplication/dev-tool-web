import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';

export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
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
  styleUrl: './drawer.component.css'
})
export class DrawerComponent implements OnChanges, OnDestroy, AfterViewChecked {
  @ViewChild('overlay') overlay?: ElementRef<HTMLElement>;
  @ViewChild('panel') panel?: ElementRef<HTMLElement>;

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

  ngAfterViewChecked(): void {
    this.appendOverlayToBody();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      this.syncBodyScroll();
      if (this.open) {
        this.triggerElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setTimeout(() => this.focusInitialElement());
      } else {
        this.removeBodyOverlay();
        this.restoreFocus();
      }
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    this.removeBodyOverlay();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.open && this.closeOnEsc && !this.loading) {
      this.close();
    }
  }

  @HostListener('document:keydown.tab', ['$event'])
  onTab(event: Event): void {
    if (!this.open) {
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

  close(): void {
    if (this.loading) {
      return;
    }

    this.open = false;
    this.openChange.emit(false);
    this.closed.emit();
    this.syncBodyScroll();
    this.removeBodyOverlay();
    this.restoreFocus();
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.close();
    }
  }

  private syncBodyScroll(): void {
    document.body.style.overflow = this.open ? 'hidden' : '';
  }

  private appendOverlayToBody(): void {
    const overlay = this.overlay?.nativeElement;
    if (!this.open || !overlay || overlay.parentElement === document.body) {
      return;
    }
    document.body.appendChild(overlay);
  }

  private removeBodyOverlay(): void {
    const overlay = this.overlay?.nativeElement;
    if (overlay?.parentElement === document.body) {
      document.body.removeChild(overlay);
    }
  }

  private focusInitialElement(): void {
    const focusable = this.focusableElements();
    (focusable[0] ?? this.panel?.nativeElement)?.focus();
  }

  private restoreFocus(): void {
    this.triggerElement?.focus();
    this.triggerElement = null;
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
    ).filter((element) => !element.hasAttribute('disabled') && element.offsetParent !== null);
  }
}
