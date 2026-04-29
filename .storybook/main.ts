import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../src/app/shared/**/*.mdx', '../src/app/shared/**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@chromatic-com/storybook'],
  framework: {
    name: '@storybook/angular',
    options: {}
  },
  docs: {
    defaultName: 'Docs'
  },
  staticDirs: ['../public']
};

export default config;
