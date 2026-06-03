import { Injectable } from '@angular/core';
import { KeycloakService } from './keycloak.service';
import { environment } from '../../../enviroment/environment';

export type AppPermission =
  | 'ADMIN_OVERVIEW_READ'
  | 'AI_AGENT_READ'
  | 'AI_AGENT_CONFIG_WRITE'
  | 'AI_AGENT_SECRET_WRITE'
  | 'AI_AGENT_EXECUTE'
  | 'AI_AGENT_WORKFLOW_WRITE'
  | 'AI_AGENT_WORKFLOW_REVIEW'
  | 'TRADE_BOT_READ'
  | 'TRADE_BOT_CONFIG_WRITE'
  | 'TRADE_BOT_SECRET_WRITE'
  | 'TRADE_BOT_RUNTIME_OPERATE'
  | 'FILE_STORAGE_READ'
  | 'FILE_STORAGE_CONFIG_WRITE'
  | 'FILE_STORAGE_SECRET_WRITE'
  | 'JOB_SCHEDULER_READ'
  | 'JOB_SCHEDULER_WRITE'
  | 'JOB_SCHEDULER_RUN'
  | 'DATA_FORM_READ'
  | 'DATA_FORM_WRITE'
  | 'DATA_FORM_IMPORT_EXPORT'
  | 'DEVTOOLS_OPERATE'
  | 'FORM_CONFIG_CREATE'
  | 'FORM_CONFIG_UPDATE'
  | 'FORM_CONFIG_IMPORT'
  | 'FORM_CONFIG_EXPORT';

export type AppRole =
  | 'AI_AGENT_VIEWER'
  | 'AI_AGENT_OPERATOR'
  | 'AI_AGENT_ADMIN'
  | 'TRADE_BOT_VIEWER'
  | 'TRADE_BOT_OPERATOR'
  | 'TRADE_BOT_ADMIN'
  | 'FILE_STORAGE_VIEWER'
  | 'FILE_STORAGE_ADMIN'
  | 'JOB_SCHEDULER_VIEWER'
  | 'JOB_SCHEDULER_OPERATOR'
  | 'JOB_SCHEDULER_ADMIN'
  | 'DATA_FORM_VIEWER'
  | 'DATA_FORM_ADMIN'
  | 'DEVTOOLS_ADMIN';

export const APP_ROLE_PERMISSIONS: Record<AppRole, readonly AppPermission[]> = {
  AI_AGENT_VIEWER: ['ADMIN_OVERVIEW_READ', 'AI_AGENT_READ'],
  AI_AGENT_OPERATOR: ['ADMIN_OVERVIEW_READ', 'AI_AGENT_READ', 'AI_AGENT_EXECUTE', 'AI_AGENT_WORKFLOW_REVIEW'],
  AI_AGENT_ADMIN: ['ADMIN_OVERVIEW_READ', 'AI_AGENT_READ', 'AI_AGENT_EXECUTE', 'AI_AGENT_WORKFLOW_REVIEW', 'AI_AGENT_CONFIG_WRITE', 'AI_AGENT_SECRET_WRITE', 'AI_AGENT_WORKFLOW_WRITE'],
  TRADE_BOT_VIEWER: ['ADMIN_OVERVIEW_READ', 'TRADE_BOT_READ'],
  TRADE_BOT_OPERATOR: ['ADMIN_OVERVIEW_READ', 'TRADE_BOT_READ', 'TRADE_BOT_RUNTIME_OPERATE'],
  TRADE_BOT_ADMIN: ['ADMIN_OVERVIEW_READ', 'TRADE_BOT_READ', 'TRADE_BOT_RUNTIME_OPERATE', 'TRADE_BOT_CONFIG_WRITE', 'TRADE_BOT_SECRET_WRITE'],
  FILE_STORAGE_VIEWER: ['ADMIN_OVERVIEW_READ', 'FILE_STORAGE_READ'],
  FILE_STORAGE_ADMIN: ['ADMIN_OVERVIEW_READ', 'FILE_STORAGE_READ', 'FILE_STORAGE_CONFIG_WRITE', 'FILE_STORAGE_SECRET_WRITE'],
  JOB_SCHEDULER_VIEWER: ['ADMIN_OVERVIEW_READ', 'JOB_SCHEDULER_READ'],
  JOB_SCHEDULER_OPERATOR: ['ADMIN_OVERVIEW_READ', 'JOB_SCHEDULER_READ', 'JOB_SCHEDULER_RUN'],
  JOB_SCHEDULER_ADMIN: ['ADMIN_OVERVIEW_READ', 'JOB_SCHEDULER_READ', 'JOB_SCHEDULER_RUN', 'JOB_SCHEDULER_WRITE'],
  DATA_FORM_VIEWER: ['ADMIN_OVERVIEW_READ', 'DATA_FORM_READ'],
  DATA_FORM_ADMIN: ['ADMIN_OVERVIEW_READ', 'DATA_FORM_READ', 'DATA_FORM_WRITE', 'DATA_FORM_IMPORT_EXPORT', 'FORM_CONFIG_CREATE', 'FORM_CONFIG_UPDATE', 'FORM_CONFIG_IMPORT', 'FORM_CONFIG_EXPORT'],
  DEVTOOLS_ADMIN: ['ADMIN_OVERVIEW_READ', 'DEVTOOLS_OPERATE']
};

export const DEVELOPER_GROUP_ROLES: readonly AppRole[] = [
  'AI_AGENT_VIEWER',
  'AI_AGENT_OPERATOR',
  'AI_AGENT_ADMIN',
  'TRADE_BOT_VIEWER',
  'TRADE_BOT_OPERATOR',
  'TRADE_BOT_ADMIN',
  'FILE_STORAGE_VIEWER',
  'FILE_STORAGE_ADMIN',
  'JOB_SCHEDULER_VIEWER',
  'JOB_SCHEDULER_OPERATOR',
  'JOB_SCHEDULER_ADMIN',
  'DATA_FORM_VIEWER',
  'DATA_FORM_ADMIN',
  'DEVTOOLS_ADMIN'
];

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly fullAccessRoles = ['ADMIN', 'SUPER_ADMIN'];
  private hasWarned = false;

  constructor(private readonly keycloakService: KeycloakService) {}

  private hasBypassFlag(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const hasParam = urlParams.has('dangerously-skip-permissions') || urlParams.get('skip-permissions') === 'true';
    const hasStorage = window.localStorage.getItem('dangerously-skip-permissions') === 'true';
    const hasEnv = (environment as any).dangerouslySkipPermissions === true;

    const shouldBypass = hasParam || hasStorage || hasEnv;

    if (shouldBypass && !this.hasWarned) {
      this.hasWarned = true;
      console.warn(
        '%c⚠️ DANGEROUSLY SKIP PERMISSIONS ACTIVE ⚠️\nAll permission checks are being bypassed.',
        'color: #ff3333; font-weight: bold; font-size: 14px; background-color: #ffe6e6; padding: 6px 12px; border: 2px solid #ff3333; border-radius: 4px;'
      );
    }

    return shouldBypass;
  }

  has(permission: AppPermission | string): boolean {
    if (this.hasBypassFlag()) {
      return true;
    }

    if (this.isFullAccess()) {
      return true;
    }

    if (this.keycloakService.hasRole(permission)) {
      return true;
    }

    return this.hasPermissionViaRole(permission);
  }

  hasAny(permissions: readonly string[]): boolean {
    return permissions.some((p) => this.has(p));
  }

  hasAll(permissions: readonly string[]): boolean {
    return permissions.every((p) => this.has(p));
  }

  private isFullAccess(): boolean {
    return this.fullAccessRoles.some((role) => this.keycloakService.hasRole(role));
  }

  private hasPermissionViaRole(permission: string): boolean {
    const roles = Object.keys(APP_ROLE_PERMISSIONS) as AppRole[];
    return roles.some(
      (role) =>
        this.keycloakService.hasRole(role) &&
        (APP_ROLE_PERMISSIONS[role] as readonly string[]).includes(permission)
    );
  }
}
