import Keycloak from 'keycloak-js';
import { Injectable, NgZone } from '@angular/core';
import { environment } from '../../../enviroment/environment';

@Injectable({ providedIn: 'root' })
export class KeycloakService {

  private keycloak!: Keycloak;

  constructor(private zone: NgZone) {}

  init(): Promise<boolean> {

    this.keycloak = new Keycloak({
      url: environment.keycloak.url,
      realm: environment.keycloak.realm,
      clientId: environment.keycloak.clientId
    });

    return this.zone.runOutsideAngular(() =>
      this.keycloak.init({
        onLoad: 'login-required',
        checkLoginIframe: false
      })
    );
  }

  get token(): string | undefined {
    return this.keycloak?.token;
  }

  get userInfo() {
    return this.keycloak?.tokenParsed;
  }

  logout() {
    this.keycloak?.logout();
  }

  hasRole(role: string): boolean {
    return this.keycloak?.hasRealmRole(role) ?? false;
  }
}
