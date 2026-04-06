import Keycloak from 'keycloak-js';
import { Injectable, NgZone } from '@angular/core';
import { environment } from '../../../enviroment/environment';

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  private keycloak!: Keycloak;
  private initialized = false;

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
    ).then((authenticated) => {
      this.initialized = authenticated;
      return authenticated;
    }).catch((error) => {
      this.initialized = false;
      throw error;
    });
  }

  get token(): string | undefined {
    return this.keycloak?.token;
  }

  get userInfo() {
    return this.keycloak?.tokenParsed;
  }

  async logout(): Promise<void> {
    const redirectUri = window.location.origin;

    if (this.initialized && this.keycloak) {
      await this.keycloak.logout({ redirectUri });
      return;
    }

    const logoutUrl =
      `${environment.keycloak.url}/realms/${environment.keycloak.realm}` +
      `/protocol/openid-connect/logout?client_id=${encodeURIComponent(environment.keycloak.clientId)}` +
      `&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`;

    window.location.assign(logoutUrl);
  }

  hasRole(role: string): boolean {
    return this.keycloak?.hasRealmRole(role) ?? false;
  }
}
