import { PermissionService, APP_ROLE_PERMISSIONS, DEVELOPER_GROUP_ROLES, AppRole } from './permission.service';
import { KeycloakService } from './keycloak.service';

describe('PermissionService', () => {
  let service: PermissionService;
  let keycloakService: { hasRole: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    keycloakService = { hasRole: vi.fn().mockReturnValue(false) };
    service = new PermissionService(keycloakService as unknown as KeycloakService);
  });

  it('grants all permissions when user has ADMIN role', () => {
    keycloakService.hasRole.mockImplementation((role: string) => role === 'ADMIN');
    expect(service.has('AI_AGENT_READ')).toBe(true);
    expect(service.has('DEVTOOLS_OPERATE')).toBe(true);
    expect(service.has('TRADE_BOT_SECRET_WRITE')).toBe(true);
  });

  it('grants all permissions when user has SUPER_ADMIN role', () => {
    keycloakService.hasRole.mockImplementation((role: string) => role === 'SUPER_ADMIN');
    expect(service.has('FILE_STORAGE_READ')).toBe(true);
    expect(service.has('JOB_SCHEDULER_WRITE')).toBe(true);
  });

  it('grants permission via direct Keycloak role matching', () => {
    keycloakService.hasRole.mockImplementation((role: string) => role === 'AI_AGENT_READ');
    expect(service.has('AI_AGENT_READ')).toBe(true);
    expect(service.has('AI_AGENT_SECRET_WRITE')).toBe(false);
  });

  it('grants permissions via app role mapping', () => {
    keycloakService.hasRole.mockImplementation((role: string) => role === 'AI_AGENT_OPERATOR');
    expect(service.has('ADMIN_OVERVIEW_READ')).toBe(true);
    expect(service.has('AI_AGENT_READ')).toBe(true);
    expect(service.has('AI_AGENT_EXECUTE')).toBe(true);
    expect(service.has('AI_AGENT_WORKFLOW_REVIEW')).toBe(true);
    expect(service.has('AI_AGENT_CONFIG_WRITE')).toBe(false);
    expect(service.has('AI_AGENT_SECRET_WRITE')).toBe(false);
  });

  it('AI_AGENT_ADMIN includes all AI Agent permissions', () => {
    keycloakService.hasRole.mockImplementation((role: string) => role === 'AI_AGENT_ADMIN');
    expect(service.has('AI_AGENT_READ')).toBe(true);
    expect(service.has('AI_AGENT_EXECUTE')).toBe(true);
    expect(service.has('AI_AGENT_WORKFLOW_REVIEW')).toBe(true);
    expect(service.has('AI_AGENT_CONFIG_WRITE')).toBe(true);
    expect(service.has('AI_AGENT_SECRET_WRITE')).toBe(true);
    expect(service.has('AI_AGENT_WORKFLOW_WRITE')).toBe(true);
  });

  it('TRADE_BOT_ADMIN includes all Trade Bot permissions', () => {
    keycloakService.hasRole.mockImplementation((role: string) => role === 'TRADE_BOT_ADMIN');
    expect(service.has('TRADE_BOT_READ')).toBe(true);
    expect(service.has('TRADE_BOT_RUNTIME_OPERATE')).toBe(true);
    expect(service.has('TRADE_BOT_CONFIG_WRITE')).toBe(true);
    expect(service.has('TRADE_BOT_SECRET_WRITE')).toBe(true);
  });

  it('DATA_FORM_ADMIN includes legacy FORM_CONFIG_* permissions', () => {
    keycloakService.hasRole.mockImplementation((role: string) => role === 'DATA_FORM_ADMIN');
    expect(service.has('DATA_FORM_READ')).toBe(true);
    expect(service.has('DATA_FORM_WRITE')).toBe(true);
    expect(service.has('FORM_CONFIG_CREATE')).toBe(true);
    expect(service.has('FORM_CONFIG_UPDATE')).toBe(true);
    expect(service.has('FORM_CONFIG_IMPORT')).toBe(true);
    expect(service.has('FORM_CONFIG_EXPORT')).toBe(true);
  });

  it('denies permission when user has no matching role', () => {
    expect(service.has('AI_AGENT_READ')).toBe(false);
    expect(service.has('DEVTOOLS_OPERATE')).toBe(false);
  });

  it('hasAll returns true only when all permissions are granted', () => {
    keycloakService.hasRole.mockImplementation((role: string) => role === 'TRADE_BOT_VIEWER');
    expect(service.hasAll(['ADMIN_OVERVIEW_READ', 'TRADE_BOT_READ'])).toBe(true);
    expect(service.hasAll(['TRADE_BOT_READ', 'TRADE_BOT_CONFIG_WRITE'])).toBe(false);
  });

  it('hasAny returns true when at least one permission is granted', () => {
    keycloakService.hasRole.mockImplementation((role: string) => role === 'FILE_STORAGE_VIEWER');
    expect(service.hasAny(['FILE_STORAGE_READ', 'TRADE_BOT_READ'])).toBe(true);
    expect(service.hasAny(['TRADE_BOT_READ', 'DEVTOOLS_OPERATE'])).toBe(false);
  });

  it('DEVELOPER_GROUP_ROLES contains all app roles', () => {
    const allRoles = Object.keys(APP_ROLE_PERMISSIONS) as AppRole[];
    expect(DEVELOPER_GROUP_ROLES.length).toBe(allRoles.length);
    allRoles.forEach((role) => {
      expect(DEVELOPER_GROUP_ROLES).toContain(role);
    });
  });
});
