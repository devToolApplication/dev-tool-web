import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { KeycloakService } from '@core/auth/keycloak.service';
import { ThemeMode, ThemeService } from '@core/theme/theme.service';
import { APP_LAYOUT_MENU } from '../config/menu.config';
import { AppMenuItem } from '../side-menu/side-menu.component';
import { AppMenuItem as MenuItemType } from '@shared/ui/primitives/button-split/button-split';
import { TieredMenuComponent } from '@shared/ui/primitives/tiered-menu/tiered-menu';

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
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Input() sidebarVisible = true;
  @Input() sidebarCollapsed = false;
  @Input() sidebarOpen = false;
  @Input() mobileLayout = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @ViewChild('userMenu') userMenu!: TieredMenuComponent;

  readonly userMenuId = 'app-user-menu';
  readonly pageTitle = signal('layout.brandName');
  readonly userDisplayName = signal('layout.userUnknown');
  readonly userRoleLabel = signal('layout.roleFallback');
  readonly userInitials = signal('DT');

  accountMenuItems: MenuItemType[] = [];

  constructor(
    private readonly router: Router,
    private readonly keycloakService: KeycloakService,
    private readonly themeService: ThemeService,
    private readonly destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.updateUserSummary();
    this.buildAccountMenuItems();
    this.updatePageTitle();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.updatePageTitle());
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
        label: 'light',
        icon: 'pi pi-sun',
        command: () => this.setThemeMode('light'),
      },
      {
        label: 'dark',
        icon: 'pi pi-moon',
        command: () => this.setThemeMode('dark'),
      },
      {
        separator: true,
      },
      {
        label: 'layout.logout',
        icon: 'pi pi-sign-out',
        command: () => this.logout(),
      },
    ];
  }

  private setThemeMode(mode: ThemeMode): void {
    this.themeService.setThemeMode(mode);
    this.userMenu.hide();
  }

  private logout(): void {
    this.userMenu.hide();
    void this.keycloakService.logout();
  }

  private updatePageTitle(): void {
    const routeTitle = this.resolveRouteTitle();
    if (routeTitle) {
      this.pageTitle.set(routeTitle);
      return;
    }

    const cleanUrl = this.normalizeUrl(this.router.url);
    const menuTrail = this.resolveMenuTrail(cleanUrl);
    const lastItem = menuTrail.at(-1);

    this.pageTitle.set(lastItem?.label ?? 'layout.brandName');
  }

  private resolveMenuTrail(url: string): AppMenuItem[] {
    let bestMatch: AppMenuItem[] = [];
    let bestMatchedPath = '';

    const visit = (items: AppMenuItem[], trail: AppMenuItem[]): void => {
      for (const item of items) {
        const nextTrail = [...trail, item];
        const itemUrl = this.normalizeUrl(String(item.routerLink ?? ''));

        if (
          itemUrl &&
          this.isRoutePrefix(itemUrl, url) &&
          itemUrl.length > bestMatchedPath.length
        ) {
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
    const cleanUrl = String(url ?? '')
      .split('?')[0]
      .split('#')[0]
      .trim();
    if (!cleanUrl) {
      return '';
    }
    return cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
  }

  private isRoutePrefix(candidate: string, url: string): boolean {
    return url === candidate || url.startsWith(`${candidate}/`);
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

    return (
      userInfo?.name?.trim() ||
      fullName ||
      userInfo?.preferred_username?.trim() ||
      'layout.userUnknown'
    );
  }

  private resolveRoleLabel(userInfo: AppShellUserInfo | undefined): string {
    const realmRoles = userInfo?.realm_access?.roles ?? [];
    const resourceRoles = Object.values(userInfo?.resource_access ?? {}).flatMap(
      (access) => access.roles ?? [],
    );
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

    const initials =
      tokens.length === 1
        ? tokens[0].slice(0, 2)
        : `${tokens[0][0]}${tokens[tokens.length - 1][0]}`;

    return initials.toUpperCase();
  }
}
