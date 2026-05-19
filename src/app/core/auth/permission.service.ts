import { Injectable } from '@angular/core';
import { KeycloakService } from './keycloak.service';

export type AppPermission =
  | 'FORM_CONFIG_CREATE'
  | 'FORM_CONFIG_UPDATE'
  | 'FORM_CONFIG_IMPORT'
  | 'FORM_CONFIG_EXPORT';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly adminRoles = ['ADMIN', 'SUPER_ADMIN'];

  constructor(private readonly keycloakService: KeycloakService) {}

  has(permission: AppPermission | string): boolean {
    return this.adminRoles.some((role) => this.keycloakService.hasRole(role)) || this.keycloakService.hasRole(permission);
  }

  hasAll(permissions: readonly string[]): boolean {
    return permissions.every((permission) => this.has(permission));
  }
}
