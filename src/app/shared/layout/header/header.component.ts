import { Component, DestroyRef, EventEmitter, Input, NgZone, OnInit, Output, ViewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Route, Router, Routes } from '@angular/router';
import { filter } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { TieredMenu } from 'primeng/tieredmenu';
import { KeycloakService } from '../../../core/auth/keycloak.service';
import { APP_LAYOUT_MENU } from '../config/menu.config';
import { AppMenuItem } from '../side-menu/side-menu.component';

interface AppShellUserInfo {
  family_name?: string;
  given_name?: string;
  name?: string;
  preferred_username?: string;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
}

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @Input() sidebarVisible = true;
  @Input() sidebarCollapsed = false;
  @Input() sidebarOpen = false;
  @Input() mobileLayout = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @ViewChild('userMenu') userMenu!: TieredMenu;

  readonly homeItem: MenuItem = {
    icon: 'pi pi-home',
    routerLink: '/admin/dashboard'
  };
  readonly pageTitle = signal('layout.brandName');
  readonly userDisplayName = signal('layout.userUnknown');
  readonly userRoleLabel = signal('layout.roleFallback');
  readonly userInitials = signal('DT');

  accountMenuItems: MenuItem[] = [];
  breadcrumbItems: MenuItem[] = [];

  constructor(
    private readonly router: Router,
    private readonly zone: NgZone,
    private readonly keycloakService: KeycloakService,
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.updateUserSummary();
    this.buildAccountMenuItems();
    this.updateBreadcrumb();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.updateBreadcrumb());
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  toggleSidebarLabel(): string {
    if (this.mobileLayout) {
      return this.sidebarOpen ? 'layout.hideMenu' : 'layout.showMenu';
    }

    return this.sidebarCollapsed ? 'layout.expandMenu' : 'layout.collapseMenu';
  }

  toggleAccountMenu(event: Event): void {
    this.userMenu.toggle(event);
  }

  private buildAccountMenuItems(): void {
    this.accountMenuItems = [
      {
        label: 'layout.settings',
        icon: 'pi pi-cog',
        command: () => this.openSettings()
      },
      {
        label: 'layout.logout',
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
    this.pageTitle.set(this.resolveRouteTitle() ?? this.breadcrumbItems.at(-1)?.label ?? 'layout.brandName');
  }

  private formatSegmentLabel(segment: string): string {
    if (segment === 'create') {
      return 'layout.route.create';
    }

    if (segment === 'edit') {
      return 'layout.route.edit';
    }

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

  private resolveRouteTitle(): string | undefined {
    let currentRoute = this.router.routerState.snapshot.root;

    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }

    const title = currentRoute.data?.['title'];
    return typeof title === 'string' && title.trim() ? title : undefined;
  }

  private updateUserSummary(): void {
    const userInfo = this.keycloakService.userInfo as AppShellUserInfo | undefined;
    const displayName = this.resolveDisplayName(userInfo);
    const role = this.resolveRoleLabel(userInfo);

    this.userDisplayName.set(displayName);
    this.userRoleLabel.set(role ?? 'layout.roleFallback');
    this.userInitials.set(this.resolveInitials(displayName));
  }

  private resolveDisplayName(userInfo: AppShellUserInfo | undefined): string {
    const fullName = [userInfo?.given_name, userInfo?.family_name].filter(Boolean).join(' ').trim();

    return userInfo?.name?.trim() || fullName || userInfo?.preferred_username?.trim() || 'layout.userUnknown';
  }

  private resolveRoleLabel(userInfo: AppShellUserInfo | undefined): string {
    const realmRoles = userInfo?.realm_access?.roles ?? [];
    const resourceRoles = Object.values(userInfo?.resource_access ?? {}).flatMap((access) => access.roles ?? []);
    const roles = [...realmRoles, ...resourceRoles];

    if (roles.some((role) => role === 'SUPER_ADMIN' || role === 'ADMIN')) {
      return 'layout.roleAdmin';
    }

    return 'layout.roleFallback';
  }

  private resolveInitials(displayName: string): string {
    if (displayName.startsWith('layout.')) {
      return 'DT';
    }

    const tokens = displayName.trim().split(/\s+/).filter(Boolean);

    if (!tokens.length) {
      return 'DT';
    }

    const initials = tokens.length === 1
      ? tokens[0].slice(0, 2)
      : `${tokens[0][0]}${tokens[tokens.length - 1][0]}`;

    return initials.toUpperCase();
  }
}
