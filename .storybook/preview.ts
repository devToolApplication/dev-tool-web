import type { Preview } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withHashLocation } from '@angular/router';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { MINIMAL_VIEWPORTS } from 'storybook/viewport';

import { APP_THEME_PRESETS } from '../src/app/core/ui-services/theme-presets';
import { SharedModule } from '../src/app/shared/shared.module';

if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', 'light');
  document.documentElement.classList.add('light');
}

const preview: Preview = {
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        provideRouter([], withHashLocation()),
        MessageService,
        providePrimeNG({
          overlayAppendTo: 'body',
          theme: {
            preset: APP_THEME_PRESETS.aura,
            options: {
              darkModeSelector: '[data-theme="dark"]',
              cssLayer: false
            }
          },
          ripple: true,
          zIndex: {
            modal: 1100,
            overlay: 1000,
            menu: 1000,
            tooltip: 1100
          }
        })
      ]
    }),
    moduleMetadata({
      imports: [SharedModule]
    })
  ],
  parameters: {
    layout: 'padded',
    viewport: {
      viewports: MINIMAL_VIEWPORTS
    },
    a11y: {
      test: 'error',
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          }
        ]
      }
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      },
      expanded: true
    },
    docs: {
      source: {
        type: 'dynamic',
        excludeDecorators: true
      },
      toc: {
        title: 'On this page'
      }
    }
  }
};

export default preview;
