import { Component, HostListener, OnInit, signal } from '@angular/core';
import { APP_LAYOUT_MENU } from '../../navigation/config/menu.config';
import { AppMenuItem } from '../../navigation/side-menu/side-menu.component';

@Component({
  selector: 'app-base-layout',
  standalone: false,
  templateUrl: './base.layout.html',
  styleUrls: ['./base.layout.css'],
})
export class BaseLayoutComponent implements OnInit {
  readonly menuItems: AppMenuItem[] = APP_LAYOUT_MENU;
  readonly sidebarCollapsed = signal(false);
  readonly sidebarOverlayOpen = signal(false);
  readonly isMobileLayout = signal(false);

  private readonly sidebarCollapsedStorageKey = 'dev-tool.sidebarCollapsed';

  ngOnInit(): void {
    this.sidebarCollapsed.set(this.readStoredBoolean(this.sidebarCollapsedStorageKey));
    this.updateLayoutMode();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateLayoutMode();
  }

  onToggleSidebar(): void {
    if (this.isMobileLayout()) {
      this.sidebarOverlayOpen.update((open) => !open);
      return;
    }

    this.sidebarCollapsed.update((collapsed) => {
      const nextCollapsed = !collapsed;
      this.storeBoolean(this.sidebarCollapsedStorageKey, nextCollapsed);
      return nextCollapsed;
    });
  }

  closeSidebarOverlay(): void {
    if (!this.isMobileLayout()) {
      return;
    }

    this.sidebarOverlayOpen.set(false);
  }

  private updateLayoutMode(): void {
    const nextIsMobile = typeof window !== 'undefined' && window.innerWidth < 992;

    if (nextIsMobile === this.isMobileLayout()) {
      return;
    }

    this.isMobileLayout.set(nextIsMobile);
    this.sidebarOverlayOpen.set(false);
  }

  private readStoredBoolean(key: string): boolean {
    if (typeof localStorage === 'undefined') {
      return false;
    }

    return localStorage.getItem(key) === 'true';
  }

  private storeBoolean(key: string, value: boolean): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(key, String(value));
  }
}
