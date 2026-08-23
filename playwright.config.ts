import { defineConfig } from '@playwright/test';

const appPort = process.env['APP_PORT'] || '4200';
const storybookPort = process.env['STORYBOOK_PORT'] || '6006';
const appBaseUrl = process.env['APP_BASE_URL'] || ('http://127.0.0.1:' + appPort);
const storybookBaseUrl = process.env['STORYBOOK_BASE_URL'] || ('http://127.0.0.1:' + storybookPort);

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  retries: 0,
  webServer: [
    {
      command: 'npm run start:dev -- --host 127.0.0.1 --port ' + appPort,
      url: appBaseUrl,
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: 'ng run dev-tool-web:storybook --host 127.0.0.1 --port ' + storybookPort + ' --ci --open=false',
      url: storybookBaseUrl,
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
  use: {
    baseURL: appBaseUrl,
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
