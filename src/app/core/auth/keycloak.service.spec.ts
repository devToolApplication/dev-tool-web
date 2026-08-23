import { NgZone } from '@angular/core';

import { environment } from '../../../enviroment/environment';
import { KeycloakService } from './keycloak.service';

describe('KeycloakService', () => {
  const originalEnabled = environment.keycloak.enabled;

  afterEach(() => {
    environment.keycloak.enabled = originalEnabled;
    localStorage.removeItem('dangerously-skip-permissions');
  });

  it('skips Keycloak on localhost when the dev permission bypass is enabled', async () => {
    environment.keycloak.enabled = true;
    localStorage.setItem('dangerously-skip-permissions', 'true');
    const zone = { runOutsideAngular: vi.fn((callback: () => unknown) => callback()) } as unknown as NgZone;

    const service = new KeycloakService(zone);

    await expect(service.init()).resolves.toBe(true);
    expect(zone.runOutsideAngular).not.toHaveBeenCalled();
    expect(service.authenticated).toBe(true);
    expect(service.userInfo?.['preferred_username']).toBe('dev-user');
    expect(service.hasRole('ANY_ROLE')).toBe(true);
  });
});
