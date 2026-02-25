import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { TieredMenu } from 'primeng/tieredmenu';
import { KeycloakService } from '../../../core/auth/keycloak.service';
import { ThemeService } from '../../../core/ui-services/theme.service';

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
  breadcrumbItems: MenuItem[] = [];

  readonly accountMenuItems: MenuItem[] = [
    {
      label: 'Cài đặt',
      icon: 'pi pi-cog',
      command: () => this.router.navigate(['/settings'])
    },
    {
      label: 'Đăng xuất',
      icon: 'pi pi-sign-out',
      command: () => this.keycloakService.logout()
    }
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly keycloakService: KeycloakService,
    private readonly themeService: ThemeService
  ) {}

  ngOnInit(): void {
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

  get darkModeEnabled(): boolean {
    return this.themeService.isDarkMode;
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  private updateBreadcrumb(): void {
    const cleanUrl = this.router.url.split('?')[0].split('#')[0];
    const segments = cleanUrl.split('/').filter(Boolean);

    this.breadcrumbItems = segments.map((segment, index) => {
      const url = '/' + segments.slice(0, index + 1).join('/');

      return {
        label: this.formatSegmentLabel(segment),
        routerLink: url
      };
    });
  }

  private formatSegmentLabel(segment: string): string {
    const normalized = segment.replace(/[-_]+/g, ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
}
