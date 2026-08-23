import { expect, test, Page } from '@playwright/test';

const STORYBOOK_BASE_URL = process.env['STORYBOOK_BASE_URL'] || 'http://127.0.0.1:6006';
const AI_GATE_STATE_MATRIX_URL =
  `${STORYBOOK_BASE_URL}/iframe.html?id=features-workflow-studio-nodes-ai-gate--state-matrix&viewMode=story`;

async function openWorkflowNodeStory(page: Page): Promise<string[]> {
  const browserErrors: string[] = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });

  await page.goto(AI_GATE_STATE_MATRIX_URL);
  await page.waitForSelector('[data-testid="workflow-node-AI_GATE"]', { timeout: 30000 });
  return browserErrors;
}

test.describe('Workflow Studio node stories', () => {
  test('renders AI gate states without browser errors', async ({ page }) => {
    const browserErrors = await openWorkflowNodeStory(page);
    expect(browserErrors, browserErrors.join('\n')).toHaveLength(0);

    await expect(page.locator('[data-testid="workflow-node-AI_GATE"]')).toHaveCount(7);
    await expect(page.getByText('Evaluate customer risk profile').first()).toBeVisible();
    await expect(page.locator('[data-runtime-status="RUNNING"]')).toBeVisible();
    await expect(page.locator('[data-runtime-status="WAITING_EXTERNAL"]')).toBeVisible();
    await expect(page.locator('[data-runtime-status="COMPLETED"]')).toBeVisible();
    await expect(page.locator('[data-runtime-status="ERROR"]')).toBeVisible();
    await expect(page.locator('.workflow-node-shell--error')).toBeVisible();
  });
});