import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionService } from '../../../core/auth/permission.service';
import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';
import { AppMenuItem, SideMenuComponent } from './side-menu.component';

describe('SideMenuComponent', () => {
  let fixture: ComponentFixture<SideMenuComponent>;
  let component: SideMenuComponent;
  let permissionService: { hasAll: ReturnType<typeof vi.fn> };

  const menuItems: AppMenuItem[] = [
    {
      label: 'Operations',
      items: [
        { label: 'Dashboard', icon: 'pi pi-gauge', routerLink: '/admin/dashboard' },
        { label: 'Models', icon: 'pi pi-microchip-ai', routerLink: '/admin/ai-agent/models' },
        { label: 'Data Forms', icon: 'pi pi-file-edit', routerLink: '/admin/data-forms/create', permissions: ['FORM_CONFIG_CREATE'] }
      ]
    }
  ];

  beforeEach(async () => {
    permissionService = {
      hasAll: vi.fn((permissions: readonly string[]) => permissions.includes('FORM_CONFIG_CREATE'))
    };

    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: [
        ...provideSharedTesting(),
        { provide: PermissionService, useValue: permissionService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SideMenuComponent);
    component = fixture.componentInstance;
    component.items = menuItems;
  });

  it('renders searchable operational links and filters permission-protected entries', () => {
    permissionService.hasAll.mockReturnValue(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Dashboard');
    expect(fixture.nativeElement.textContent).toContain('Models');
    expect(fixture.nativeElement.textContent).not.toContain('Data Forms');

    component.onSearchChange('models');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Dashboard');
    expect(fixture.nativeElement.textContent).toContain('Models');
  });

  it('keeps collapsed menu usable with active state and tooltips', () => {
    component.collapsed = true;
    component.currentUrl.set('/admin/dashboard');
    fixture.detectChanges();

    const sidebar: HTMLElement = fixture.nativeElement.querySelector('.sidebar');
    const activeLink: HTMLAnchorElement = fixture.nativeElement.querySelector('a.menu-link.active');

    expect(sidebar.classList).toContain('sidebar--collapsed');
    expect(activeLink?.getAttribute('title')).toBe('Dashboard');
    expect(activeLink?.getAttribute('aria-current')).toBe('page');
  });
});
