import {
  PermissionService,
  APP_ROLE_PERMISSIONS,
  DEVELOPER_GROUP_ROLES,
  AppRole,
} from './permission.service';
import { KeycloakService } from './keycloak.service';
import { environment } from '../../../enviroment/environment';

describe('PermissionService', () => {
  let service: PermissionService;
  let keycloakService: { hasRole: ReturnType<typeof vi.fn> };
  const originalDangerouslySkipPermissions = environment.dangerouslySkipPermissions;

  beforeEach(() => {
    (environment as any).dangerouslySkipPermissions = false;
    localStorage.removeItem('dangerously-skip-permissions');
    keycloakService = {
      hasRole: vi.fn().mockReturnValue(false),
    };
    service = new PermissionService(keycloakService as unknown as KeycloakService);
  });

  afterEach(() => {
    localStorage.removeItem('dangerously-skip-permissions');
    (environment as any).dangerouslySkipPermissions = originalDangerouslySkipPermissions;
  });

  it('denies when no roles match', () => {
    expect(service.has('AI_AGENT_CONFIG_WRITE')).toBe(false);
  });

  it('allows when user has full access role', () => {
    keycloakService.hasRole.mockImplementation((role: string) => role === 'ADMIN');
    expect(service.has('AI_AGENT_CONFIG_WRITE')).toBe(true);
  });

  it('allows when user has direct role', () => {
    keycloakService.hasRole.mockImplementation((role: string) => role === 'AI_AGENT_CONFIG_WRITE');
    expect(service.has('AI_AGENT_CONFIG_WRITE')).toBe(true);
  });

  it('allows when user has role with permission', () => {
    keycloakService.hasRole.mockImplementation((role: string) => role === 'AI_AGENT_ADMIN');
    expect(service.has('AI_AGENT_CONFIG_WRITE')).toBe(true);
  });

  it('hasAny returns true when at least one permission is granted', () => {
    keycloakService.hasRole.mockImplementation((role: string) => role === 'AI_AGENT_ADMIN');
    expect(service.hasAny(['AI_AGENT_CONFIG_WRITE', 'TRADE_BOT_SECRET_WRITE'])).toBe(true);
  });

  it('hasAll returns false when not all permissions are granted', () => {
    keycloakService.hasRole.mockImplementation((role: string) => role === 'AI_AGENT_ADMIN');
    expect(service.hasAll(['AI_AGENT_CONFIG_WRITE', 'TRADE_BOT_SECRET_WRITE'])).toBe(false);
  });

  it('APP_ROLE_PERMISSIONS covers all roles', () => {
    const roles = Object.keys(APP_ROLE_PERMISSIONS) as AppRole[];
    expect(roles.length).toBeGreaterThan(0);
  });

  it('DEVELOPER_GROUP_ROLES are all valid AppRoles', () => {
    DEVELOPER_GROUP_ROLES.forEach((role: AppRole) => {
      expect(APP_ROLE_PERMISSIONS[role]).toBeDefined();
    });
  });

  it('every DEVELOPER_GROUP_ROLES entry is an AppRole', () => {
    DEVELOPER_GROUP_ROLES.forEach((role) => {
      expect(APP_ROLE_PERMISSIONS[role as AppRole]).toBeDefined();
    });
  });

  it('skips all permission checks when dangerously-skip-permissions is set in URL search', () => {
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        search: '?dangerously-skip-permissions',
        href: 'http://localhost/?dangerously-skip-permissions',
      },
      writable: true,
      configurable: true,
    });

    expect(service.has('AI_AGENT_CONFIG_WRITE')).toBe(true);
    expect(service.has('TRADE_BOT_SECRET_WRITE')).toBe(true);

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it('skips all permission checks when dangerously-skip-permissions is set in localStorage', () => {
    localStorage.setItem('dangerously-skip-permissions', 'true');
    expect(service.has('AI_AGENT_CONFIG_WRITE')).toBe(true);
    expect(service.has('TRADE_BOT_SECRET_WRITE')).toBe(true);
    localStorage.removeItem('dangerously-skip-permissions');
  });

  it('skips all permission checks when dangerouslySkipPermissions is set in environment config', () => {
    (environment as any).dangerouslySkipPermissions = true;
    expect(service.has('AI_AGENT_CONFIG_WRITE')).toBe(true);
    expect(service.has('TRADE_BOT_SECRET_WRITE')).toBe(true);
    (environment as any).dangerouslySkipPermissions = false;
  });
});
