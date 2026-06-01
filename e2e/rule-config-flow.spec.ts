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

async function navigateToRuleCreate(page: Page): Promise<void> {
  await login(page);
  await page.goto(APP_URL + RULE_CREATE_URL);
  await page.waitForSelector('.flow-builder', { timeout: 20000 });
  await page.waitForTimeout(1000);
}

async function addNodeFromPalette(page: Page, label: RegExp): Promise<void> {
  const paletteItem = page.locator('.flow-palette__item').filter({ hasText: label }).first();
  await expect(paletteItem).toBeVisible();
  await paletteItem.dblclick();
  await page.waitForTimeout(800);
}

test.describe('Rule Config Flow Editor - JointJS core-only canvas', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToRuleCreate(page);
  });

  test('renders rule nodes as native JointJS SVG elements', async ({ page }) => {
    await addNodeFromPalette(page, /group/i);

    const node = page.locator('.joint-element').first();
    await expect(node).toBeVisible();
    await expect(node).toContainText(/AND|OR|XOR/);
    await expect(page.locator('.rule-flow-node')).toHaveCount(0);
  });

  test('does not render legacy plus add-node overlay in core-only mode', async ({ page }) => {
    await addNodeFromPalette(page, /group/i);

    await expect(page.locator('.flow-add-button__trigger')).toBeHidden();
  });

  test('exposes native JointJS ports for link dragging', async ({ page }) => {
    await addNodeFromPalette(page, /group/i);

    await expect(page.locator('svg [port="out"]').first()).toBeVisible();
    await expect(page.locator('svg [port="in"]').first()).toBeVisible();
  });

  test('keeps navigator/minimap off until a core replacement is implemented', async ({ page }) => {
    await expect(page.locator('.flow-navigator')).toBeHidden();
  });

  test('selecting a SVG node opens the inspector panel', async ({ page }) => {
    await addNodeFromPalette(page, /group/i);

    const node = page.locator('.joint-element').first();
    await node.click();

    await expect(page.locator('.flow-builder__inspector')).toBeVisible();
    await expect(page.locator('app-flow-inspector-form-panel, app-select').first()).toBeVisible();
  });
});
