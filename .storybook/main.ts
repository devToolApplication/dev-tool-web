import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: [
    '../src/app/shared/**/*.mdx',
    '../src/app/shared/**/*.stories.ts',
    '../src/app/features/**/*.stories.ts'
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@chromatic-com/storybook',
    '@storybook/addon-controls',
    '@storybook/addon-viewport'
  ],
  framework: {
    name: '@storybook/angular',
    options: {}
  },
  docs: {
    defaultName: 'Docs',
    autodocs: true
  },
  staticDirs: ['../public'],
  webpackFinal: async (config) => {
    // Handle CSS imports from PrimeNG and other dependencies
    return config;
  },
  typescript: {
    reactDocgen: 'react'
  }
};

export default config;
