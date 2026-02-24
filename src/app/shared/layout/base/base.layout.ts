import { Component, HostListener, OnInit } from '@angular/core';
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
  sidebarVisible = true;

  private isMobileLayout = false;

  ngOnInit(): void {
    this.updateLayoutMode();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateLayoutMode();
  }

  onToggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebarOverlay(): void {
    if (!this.isMobileLayout) {
      return;
    }

    this.sidebarVisible = false;
  }

  private updateLayoutMode(): void {
    const nextIsMobile = window.innerWidth < 992;

    if (nextIsMobile === this.isMobileLayout) {
      return;
    }

    this.isMobileLayout = nextIsMobile;
    this.sidebarVisible = !this.isMobileLayout;
  }
}
