import Keycloak from 'keycloak-js';
import { Injectable, NgZone } from '@angular/core';
import { environment } from '../../../enviroment/environment';

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  private keycloak!: Keycloak;
  private initialized = false;
  private logoutInProgress = false;
  private readonly authEnabled = environment.keycloak.enabled !== false;

  constructor(private zone: NgZone) {}

  init(): Promise<boolean> {
    if (!this.authEnabled) {
      this.initialized = true;
      return Promise.resolve(true);
    }

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

  get authenticated(): boolean {
    return !this.authEnabled || !!this.keycloak?.authenticated;
  }

  get userInfo() {
    if (!this.authEnabled) {
      return {
        preferred_username: 'dev-user',
        name: 'Dev User',
        realm_access: { roles: ['ADMIN'] }
      };
    }

    return this.keycloak?.tokenParsed;
  }

  async logout(): Promise<void> {
    if (this.logoutInProgress) {
      return;
    }

    this.logoutInProgress = true;
    const redirectUri = this.resolvePostLogoutRedirectUri();

    if (!this.authEnabled) {
      window.location.assign(redirectUri);
      return;
    }

    if (this.initialized && this.keycloak) {
      try {
        await this.zone.runOutsideAngular(() => this.keycloak.logout({ redirectUri }));
        return;
      } catch {
        this.redirectToLogoutEndpoint(redirectUri);
        return;
      }
    }

    this.redirectToLogoutEndpoint(redirectUri);
  }

  handleUnauthorized(): void {
    void this.logout();
  }

  private resolvePostLogoutRedirectUri(): string {
    return window.location.href;
  }

  private redirectToLogoutEndpoint(redirectUri: string): void {
    const logoutUrl =
      `${environment.keycloak.url}/realms/${environment.keycloak.realm}` +
      `/protocol/openid-connect/logout?client_id=${encodeURIComponent(environment.keycloak.clientId)}` +
      `&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`;

    window.location.assign(logoutUrl);
  }

  hasRole(role: string): boolean {
    if (!this.authEnabled) {
      return true;
    }

    return this.keycloak?.hasRealmRole(role) ?? false;
  }
}
