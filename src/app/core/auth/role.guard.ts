import {CanActivateFn} from '@angular/router';
import {inject} from '@angular/core';
import {KeycloakService} from './keycloak.service';

export const roleGuard = (role: string): CanActivateFn => {
  return () => {
    const keycloak = inject(KeycloakService);
    return keycloak.hasRole(role);
  };
};
