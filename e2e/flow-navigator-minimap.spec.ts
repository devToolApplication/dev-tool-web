import { test, expect, Page } from '@playwright/test';

const APP_URL = 'http://localhost:4200';
const RULE_CREATE_URL = '/admin/trade-bot/rule-configs/create';

async function login(page: Page): Promise<void> {
  await page.goto(APP_URL);
  await page.waitForTimeout(2000);
  const url = page.url();
  if (url.includes('auth') || url.includes('login') || url.includes('keycloak')) {
    await page.fill('input[name="username"], #username', 'lamld');
    await page.fill('input[name="password"], #password', 'Zzxx25102001');
    await page.click('input[type="submit"], button[type="submit"], #kc-login');
    await page.waitForURL('**/admin/**', { timeout: 15000 });
  }
}

test.describe('Flow Navigator - JointJS core-only mode', () => {
  test('minimap is disabled by default because JointJS+ Navigator is not available', async ({
    page,
  }) => {
    await login(page);
    await page.goto(APP_URL + RULE_CREATE_URL);
    await page.waitForSelector('.flow-builder', { timeout: 20000 });

    await expect(page.locator('.flow-navigator')).toBeHidden();
    await expect(page.locator('.flow-builder__toolbar')).toBeVisible();
    await expect(page.locator('.flow-builder__toolbar')).not.toContainText(
      'shared.flowBuilder.toolbar.navigator',
    );
  });
});
