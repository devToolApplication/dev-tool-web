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
          theme: {
            preset: APP_THEME_PRESETS.aura,
            options: {
              darkModeSelector: '[data-theme="dark"]'
            }
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
      options: MINIMAL_VIEWPORTS
    },
    a11y: {
      test: 'todo'
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    docs: {
      source: {
        type: 'dynamic'
      }
    }
  }
};

export default preview;
