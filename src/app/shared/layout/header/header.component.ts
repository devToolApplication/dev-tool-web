import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { TieredMenu } from 'primeng/tieredmenu';
import { KeycloakService } from '../../../core/auth/keycloak.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  @ViewChild('userMenu') userMenu!: TieredMenu;

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

  constructor(
    private readonly i18nService: I18nService,
    private readonly router: Router,
    private readonly keycloakService: KeycloakService
  ) {}

  t(key: 'app.title' | 'app.settings'): string {
    return this.i18nService.t(key);
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  toggleAccountMenu(event: Event): void {
    this.userMenu.toggle(event);
  }
}
