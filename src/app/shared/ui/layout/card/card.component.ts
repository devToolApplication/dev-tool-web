import { Component, HostBinding, Input } from '@angular/core';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardSurface = 'default' | 'strong';

@Component({
  selector: 'app-card',
  standalone: false,
  template: `<ng-content></ng-content>`,
  styles: [`
    :host {
      display: block;
      min-width: 0;
      border: 1px solid var(--app-border);
      border-radius: 0.5rem;
      background: var(--app-card-surface);
      box-shadow: var(--app-shadow-sm);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }

    :host(.app-card--strong) {
      background: var(--app-card-surface-strong);
    }

    :host(.app-card--interactive) {
      transition: box-shadow 160ms ease, border-color 160ms ease, transform 160ms ease;
    }

    :host(.app-card--interactive:hover) {
      border-color: var(--app-border-strong);
      box-shadow: var(--app-shadow-md);
      transform: translateY(-1px);
    }
  `]
})
export class CardComponent {
  @Input() padding: CardPadding = 'md';
  @Input() surface: CardSurface = 'default';
  @Input() interactive = false;
  @Input() fullHeight = false;

  @HostBinding('style.padding')
  get hostPadding(): string {
    switch (this.padding) {
      case 'none':
        return '0';
      case 'sm':
        return '0.75rem';
      case 'lg':
        return '1.25rem';
      case 'md':
      default:
        return '1rem';
    }
  }

  @HostBinding('style.height')
  get hostHeight(): string | null {
    return this.fullHeight ? '100%' : null;
  }

  @HostBinding('class.app-card--strong')
  get isStrong(): boolean {
    return this.surface === 'strong';
  }

  @HostBinding('class.app-card--interactive')
  get isInteractive(): boolean {
    return this.interactive;
  }
}
