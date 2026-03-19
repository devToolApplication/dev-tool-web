import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { TieredMenu } from 'primeng/tieredmenu';
import { KeycloakService } from '../../../core/auth/keycloak.service';
import { I18nService } from '../../../core/ui-services/i18n.service';

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

  get accountMenuItems(): MenuItem[] {
    return [
      {
        label: this.i18nService.t('layout.settings'),
        icon: 'pi pi-cog',
        command: () => this.router.navigate(['/settings'])
      },
      {
        label: this.i18nService.t('layout.logout'),
        icon: 'pi pi-sign-out',
        command: () => this.keycloakService.logout()
      }
    ];
  }

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly keycloakService: KeycloakService,
    private readonly i18nService: I18nService
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
