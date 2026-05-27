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
    '@storybook/addon-designs',
    '@chromatic-com/storybook'
  ],
  framework: {
    name: '@storybook/angular',
    options: {}
  },
  docs: {
    defaultName: 'Docs',
    autodocs: true
  },
  staticDirs: ['../public']
};

export default config;
