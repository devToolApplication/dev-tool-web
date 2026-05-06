import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withHashLocation } from '@angular/router';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';

import { APP_THEME_PRESETS } from '../../core/ui-services/theme-presets';

export function provideSharedTesting(): Array<Provider | EnvironmentProviders> {
  installMatchMediaMock();

  return [
    provideHttpClient(),
    provideNoopAnimations(),
    provideRouter([], withHashLocation()),
    MessageService,
    providePrimeNG({
      theme: {
        preset: APP_THEME_PRESETS.aura,
        options: {
          darkModeSelector: '[data-theme="dark"]'
        }
      }
    })
  ];
}

function installMatchMediaMock(): void {
  if (typeof window === 'undefined' || typeof window.matchMedia === 'function') {
    return;
  }

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    })
  });
}
