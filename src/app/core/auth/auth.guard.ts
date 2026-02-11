import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { KeycloakService } from './keycloak.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private keycloak: KeycloakService) {}

  canActivate(): boolean {
    return !!this.keycloak.token;
  }
}
