import { Component, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NavigationEnd, Route, Router, Routes } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { TieredMenu } from 'primeng/tieredmenu';
import { KeycloakService } from '../../../core/auth/keycloak.service';
import { I18nService } from '../../../core/ui-services/i18n.service';
import { APP_LAYOUT_MENU } from '../config/menu.config';
import { AppMenuItem } from '../side-menu/side-menu.component';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() sidebarVisible = true;
  @Output() toggleSidebar = new EventEmitter<void>();
  @ViewChild('userMenu') userMenu!: TieredMenu;

  readonly homeItem: MenuItem = {
    icon: 'pi pi-home',
    routerLink: '/'
  };
  accountMenuItems: MenuItem[] = [];
  breadcrumbItems: MenuItem[] = [];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly zone: NgZone,
    private readonly keycloakService: KeycloakService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.buildAccountMenuItems();
    this.updateBreadcrumb();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.updateBreadcrumb());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  toggleAccountMenu(event: Event): void {
    this.userMenu.toggle(event);
  }

  private buildAccountMenuItems(): void {
    this.accountMenuItems = [
      {
        label: this.i18nService.t('layout.settings'),
        icon: 'pi pi-cog',
        command: () => this.openSettings()
      },
      {
        label: this.i18nService.t('layout.logout'),
        icon: 'pi pi-sign-out',
        command: () => this.logout()
      }
    ];
  }

  private openSettings(): void {
    this.zone.run(() => {
      this.userMenu.hide();
      void this.router.navigateByUrl('/settings');
    });
  }

  private logout(): void {
    this.userMenu.hide();
    void this.keycloakService.logout();
  }

  private updateBreadcrumb(): void {
    const cleanUrl = this.normalizeUrl(this.router.url);
    const segments = cleanUrl.split('/').filter(Boolean);
    const menuTrail = this.resolveMenuTrail(cleanUrl);
    const lastLinkedMenuItem = [...menuTrail].reverse().find((item) => !!item.routerLink);
    const matchedSegments = this.normalizeUrl(String(lastLinkedMenuItem?.routerLink ?? ''))
      .split('/')
      .filter(Boolean).length;

    const breadcrumbItems = menuTrail.map((item) => ({
      label: item.label,
      routerLink: item.routerLink
    }));

    const extraItems = segments.slice(matchedSegments).map((segment, index) => {
      const targetUrl = '/' + segments.slice(0, matchedSegments + index + 1).join('/');

      return {
        label: this.formatSegmentLabel(segment),
        routerLink: this.canNavigateTo(targetUrl) ? targetUrl : undefined
      };
    });

    this.breadcrumbItems = [...breadcrumbItems, ...extraItems];
  }

  private formatSegmentLabel(segment: string): string {
    const normalized = segment.replace(/[-_]+/g, ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  private resolveMenuTrail(url: string): AppMenuItem[] {
    let bestMatch: AppMenuItem[] = [];
    let bestMatchedPath = '';

    const visit = (items: AppMenuItem[], trail: AppMenuItem[]): void => {
      for (const item of items) {
        const nextTrail = [...trail, item];
        const itemUrl = this.normalizeUrl(String(item.routerLink ?? ''));

        if (itemUrl && this.isRoutePrefix(itemUrl, url) && itemUrl.length > bestMatchedPath.length) {
          bestMatch = nextTrail;
          bestMatchedPath = itemUrl;
        }

        if (item.items?.length) {
          visit(item.items, nextTrail);
        }
      }
    };

    visit(APP_LAYOUT_MENU, []);
    return bestMatch.filter((item) => !!item.label);
  }

  private normalizeUrl(url: string): string {
    const cleanUrl = String(url ?? '').split('?')[0].split('#')[0].trim();
    if (!cleanUrl) {
      return '';
    }
    return cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
  }

  private isRoutePrefix(candidate: string, url: string): boolean {
    return url === candidate || url.startsWith(`${candidate}/`);
  }

  private canNavigateTo(url: string): boolean {
    const segments = this.normalizeUrl(url).split('/').filter(Boolean);
    return this.matchesRoutes(this.router.config, segments);
  }

  private matchesRoutes(routes: Routes, segments: string[]): boolean {
    for (const route of routes) {
      if (route.path === '**') {
        continue;
      }

      const routeSegments = this.getRouteSegments(route);
      if (!this.matchesPathSegments(routeSegments, segments)) {
        continue;
      }

      const remainingSegments = segments.slice(routeSegments.length);

      if (remainingSegments.length === 0) {
        return true;
      }

      if (route.children?.length && this.matchesRoutes(route.children, remainingSegments)) {
        return true;
      }
    }

    return false;
  }

  private getRouteSegments(route: Route): string[] {
    const path = route.path ?? '';
    if (!path) {
      return [];
    }

    return path.split('/').filter(Boolean);
  }

  private matchesPathSegments(routeSegments: string[], urlSegments: string[]): boolean {
    if (routeSegments.length > urlSegments.length) {
      return false;
    }

    return routeSegments.every((routeSegment, index) => routeSegment.startsWith(':') || routeSegment === urlSegments[index]);
  }
}
