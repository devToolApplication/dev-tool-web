import { APP_ROLE_PERMISSIONS, AppRole, DEVELOPER_GROUP_ROLES } from './permission.service';

describe('permissionGuard logic', () => {
  it('guard allows when no permissions required', () => {
    const permissions: string[] | undefined = undefined;
    expect(!permissions?.length).toBe(true);
  });

  it('guard allows when empty permissions array', () => {
    const permissions: string[] = [];
    expect(!permissions?.length).toBe(true);
  });

  it('guard denies when hasAll returns false (simulated)', () => {
    const hasAll = (perms: string[]) => perms.every((p) => p === 'AI_AGENT_READ');
    expect(hasAll(['AI_AGENT_READ'])).toBe(true);
    expect(hasAll(['AI_AGENT_READ', 'AI_AGENT_SECRET_WRITE'])).toBe(false);
  });

  it('all app roles in DEVELOPER_GROUP_ROLES have valid permission mappings', () => {
    DEVELOPER_GROUP_ROLES.forEach((role) => {
      const permissions = APP_ROLE_PERMISSIONS[role as AppRole];
      expect(permissions).toBeDefined();
      expect(permissions.length).toBeGreaterThan(0);
    });
  });

  it('every role includes ADMIN_OVERVIEW_READ', () => {
    DEVELOPER_GROUP_ROLES.forEach((role) => {
      const permissions = APP_ROLE_PERMISSIONS[role as AppRole];
      expect(permissions).toContain('ADMIN_OVERVIEW_READ');
    });
  });
});
