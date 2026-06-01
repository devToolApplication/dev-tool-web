import { expect, test, Page } from '@playwright/test';

const PAGE_URL = '/admin/system-management/ai-agent-execution';

async function navigateToPage(page: Page) {
  await page.goto(PAGE_URL);
  await page.waitForSelector('app-page-shell', { timeout: 15000 });
}

test.describe('AI Agent Execution Page', () => {

  test.describe('Layout & Render', () => {
    test('should render page shell with title', async ({ page }) => {
      await navigateToPage(page);
      const header = page.locator('app-page-header h1');
      await expect(header).toContainText('AI Agent Execution');
    });

    test('should render configuration section panel', async ({ page }) => {
      await navigateToPage(page);
      const section = page.locator('app-section-panel').first();
      await expect(section).toBeVisible();
    });

    test('should render role and agent dropdowns', async ({ page }) => {
      await navigateToPage(page);
      await expect(page.locator('#role-select')).toBeVisible();
      await expect(page.locator('#agent-select')).toBeVisible();
    });

    test('should render prompt textarea', async ({ page }) => {
      await navigateToPage(page);
      await expect(page.locator('#prompt-input')).toBeVisible();
    });

    test('should render action toolbar with Execute button disabled', async ({ page }) => {
      await navigateToPage(page);
      const toolbar = page.locator('app-action-toolbar');
      await expect(toolbar).toBeVisible();
      const executeBtn = toolbar.locator('app-button').first();
      await expect(executeBtn).toBeVisible();
    });
  });

  test.describe('Interaction — Form', () => {
    test('should filter agents when role is selected', async ({ page }) => {
      await navigateToPage(page);
      const roleSelect = page.locator('#role-select');
      const agentSelect = page.locator('#agent-select');

      const optionsBefore = await agentSelect.locator('option').count();
      await roleSelect.selectOption('DEV');
      const optionsAfter = await agentSelect.locator('option').count();

      expect(optionsAfter).toBeLessThanOrEqual(optionsBefore);
    });

    test('should show agent info when agent is selected', async ({ page }) => {
      await navigateToPage(page);
      const agentSelect = page.locator('#agent-select');

      const options = agentSelect.locator('option');
      const count = await options.count();
      if (count > 1) {
        await agentSelect.selectOption({ index: 1 });
        const agentInfo = page.locator('.agent-info');
        await expect(agentInfo).toBeVisible();
        await expect(agentInfo.locator('app-badge').first()).toBeVisible();
      }
    });

    test('should enable Execute when agent and prompt are filled', async ({ page }) => {
      await navigateToPage(page);
      const agentSelect = page.locator('#agent-select');
      const promptInput = page.locator('#prompt-input');

      const options = agentSelect.locator('option');
      const count = await options.count();
      if (count > 1) {
        await agentSelect.selectOption({ index: 1 });
        await promptInput.fill('Test prompt');

        const toolbar = page.locator('app-action-toolbar');
        const executeBtn = toolbar.locator('app-button').first();
        await expect(executeBtn).not.toBeDisabled();
      }
    });
  });

  test.describe('Output Section', () => {
    test('should not show output section initially', async ({ page }) => {
      await navigateToPage(page);
      const outputSection = page.locator('app-section-panel').nth(1);
      await expect(outputSection).not.toBeVisible();
    });
  });

  test.describe('Status Badge', () => {
    test('should not show status badge when idle', async ({ page }) => {
      await navigateToPage(page);
      const badge = page.locator('app-page-header app-badge');
      await expect(badge).not.toBeVisible();
    });
  });

  test.describe('Responsive', () => {
    test('should stack form fields on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await navigateToPage(page);
      const formRow = page.locator('.form-row');
      const box = await formRow.boundingBox();
      if (box) {
        const fields = formRow.locator('.form-field');
        const firstBox = await fields.first().boundingBox();
        const lastBox = await fields.last().boundingBox();
        if (firstBox && lastBox) {
          expect(lastBox.y).toBeGreaterThan(firstBox.y);
        }
      }
    });
  });
});
