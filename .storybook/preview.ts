import type { Preview } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withHashLocation } from '@angular/router';
import { MINIMAL_VIEWPORTS } from 'storybook/viewport';

import { SharedModule } from '../src/app/shared/shared.module';

const customViewports = {
  ...MINIMAL_VIEWPORTS,
  mobile: {
    name: 'Mobile 390px',
    styles: { width: '390px', height: '844px' },
  },
  tablet: {
    name: 'Tablet 768px',
    styles: { width: '768px', height: '1024px' },
  },
  laptop: {
    name: 'Laptop 1024px',
    styles: { width: '1024px', height: '768px' },
  },
  desktop: {
    name: 'Desktop 1440px',
    styles: { width: '1440px', height: '900px' },
  },
};

const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'circlehollow', title: 'Light' },
          { value: 'dark', icon: 'circle', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (storyFn, context) => {
      const theme = context.globals['theme'] || 'light';
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        }
      }
      return storyFn();
    },
    applicationConfig({
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        provideRouter([], withHashLocation()),
      ],
    }),
    moduleMetadata({
      imports: [SharedModule],
    }),
  ],
  parameters: {
    layout: 'padded',
    viewport: {
      viewports: customViewports,
    },
    a11y: {
      test: 'error',
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
    },
    docs: {
      source: {
        type: 'dynamic',
        excludeDecorators: true,
      },
      toc: {
        title: 'On this page',
      },
    },
  },
};

export default preview;
