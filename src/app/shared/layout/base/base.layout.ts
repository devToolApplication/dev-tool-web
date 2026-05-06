import { Component, DestroyRef, HostListener, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { APP_LAYOUT_MENU } from '../config/menu.config';
import { AppMenuItem } from '../side-menu/side-menu.component';

@Component({
  selector: 'app-base-layout',
  standalone: false,
  templateUrl: './base.layout.html',
  styleUrls: ['./base.layout.css']
})
export class BaseLayoutComponent implements OnInit {
  readonly menuItems: AppMenuItem[] = APP_LAYOUT_MENU;
  readonly sidebarVisible = signal(true);
  readonly usePageWrapper = signal(true);

  private readonly isMobileLayout = signal(false);

  constructor(
    private readonly router: Router,
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.updateLayoutMode();
    this.updatePageWrapper(this.router.url);

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => this.updatePageWrapper((event as NavigationEnd).urlAfterRedirects));
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateLayoutMode();
  }

  onToggleSidebar(): void {
    this.sidebarVisible.update((visible) => !visible);
  }

  closeSidebarOverlay(): void {
    if (!this.isMobileLayout()) {
      return;
    }

    this.sidebarVisible.set(false);
  }

  private updateLayoutMode(): void {
    const nextIsMobile = window.innerWidth < 992;

    if (nextIsMobile === this.isMobileLayout()) {
      return;
    }

    this.isMobileLayout.set(nextIsMobile);
    this.sidebarVisible.set(!this.isMobileLayout());
  }

  private updatePageWrapper(url: string): void {
    this.usePageWrapper.set(!url.startsWith('/admin/dashboard'));
  }
}
