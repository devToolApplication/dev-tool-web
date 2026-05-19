import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeycloakService } from '../../../core/auth/keycloak.service';
import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;
  let keycloakService: { userInfo: unknown; logout: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    keycloakService = {
      userInfo: {
        name: 'An Nguyen',
        realm_access: {
          roles: ['default-roles-develop_tool_realm', 'ADMIN']
        }
      },
      logout: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: [
        ...provideSharedTesting(),
        { provide: KeycloakService, useValue: keycloakService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('shows real user identity and role in the sticky app header', () => {
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    const host: HTMLElement = fixture.nativeElement;
    const userMenuButton: HTMLButtonElement = fixture.nativeElement.querySelector('.user-menu-button');

    expect(text).toContain('An Nguyen');
    expect(component.userRoleLabel()).toBe('layout.roleAdmin');
    expect(text).toContain('Quản trị viên');
    expect(host.querySelector('.header-toolbar')).toBeTruthy();
    expect(userMenuButton.getAttribute('aria-label')).toBe('Menu tài khoản');
  });

  it('uses distinct sidebar toggle labels for desktop collapse and mobile drawer', () => {
    component.sidebarCollapsed = true;
    expect(component.toggleSidebarLabel()).toBe('layout.expandMenu');

    component.mobileLayout = true;
    component.sidebarOpen = true;
    expect(component.toggleSidebarLabel()).toBe('layout.hideMenu');
  });
});
