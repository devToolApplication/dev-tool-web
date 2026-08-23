import { expect, test, Page } from '@playwright/test';

const STORY_URL =
  'http://127.0.0.1:6006/iframe.html?id=features-system-management-ai-agent-workflow-canvas--canvas&viewMode=story';

async function openCanvasStory(page: Page) {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  await page.goto(STORY_URL);
  await page.waitForSelector('.workflow-builder-page', { timeout: 30000 });
  await page.waitForSelector('.flow-builder', { timeout: 30000 });
  try {
    await page.waitForSelector('.joint-element', { timeout: 30000 });
  } catch (error) {
    throw new Error(
      `JointJS nodes did not render. Browser errors: ${browserErrors.join(' | ') || 'none'}`,
    );
  }
}

async function portCenterForNodeText(page: Page, text: string, port: string) {
  return page.evaluate(
    ({ text, port }) => {
      const elements = Array.from(document.querySelectorAll<SVGGElement>('.joint-element'));
      const element = elements.find((item) => item.textContent?.includes(text));
      if (!element) {
        throw new Error(`Node with text "${text}" not found`);
      }
      const portElement = element.querySelector<SVGElement>(`[port="${port}"]`);
      if (!portElement) {
        throw new Error(`Port "${port}" not found on "${text}"`);
      }
      const rect = portElement.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    },
    { text, port },
  );
}

async function clickFirstLink(page: Page) {
  const center = await page.evaluate(() => {
    const path = document.querySelector<SVGPathElement>('.joint-link path');
    if (!path) throw new Error('No link path found');
    const rect = path.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  });
  await page.mouse.click(center.x, center.y);
}

test.describe('AI Agent Workflow Canvas Story', () => {
  test.beforeEach(async ({ page }) => {
    await openCanvasStory(page);
  });

  test('renders required workflow builder controls and demo-style canvas sections', async ({
    page,
  }) => {
    await expect(page.locator('.workflow-builder-header')).toContainText('Support Triage Workflow');
    await expect(page.locator('.flow-builder__toolbar')).toBeVisible();
    await expect(page.locator('.flow-builder__palette')).toBeVisible();
    await expect(page.locator('.flow-builder__inspector')).toBeVisible();
    await expect(page.locator('.flow-navigator')).toBeVisible();
    await expect(page.getByText('Classify Intent')).toBeVisible();
    await expect(page.getByText('Bug Report?')).toBeVisible();
    await expect(page.locator('.flow-palette__item')).toHaveCount(5);
    await expect(page.locator('[data-testid="flow-builder-command-fullscreen"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Validate', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Publish', exact: true })).toBeVisible();
  });

  test('adds a node from palette and persists drag movement on the JointJS canvas', async ({
    page,
  }) => {
    const beforeCount = await page.locator('.joint-element').count();
    await page.locator('.flow-palette__item').filter({ hasText: 'AI Agent' }).dblclick();
    await expect(page.locator('.joint-element')).toHaveCount(beforeCount + 1);

    const node = page.locator('.joint-element').last();
    const beforeBox = await node.boundingBox();
    expect(beforeBox).not.toBeNull();

    await page.mouse.move(
      beforeBox!.x + beforeBox!.width / 2,
      beforeBox!.y + beforeBox!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      beforeBox!.x + beforeBox!.width / 2 + 90,
      beforeBox!.y + beforeBox!.height / 2 + 40,
      { steps: 10 },
    );
    await page.mouse.up();

    const afterBox = await node.boundingBox();
    expect(afterBox).not.toBeNull();
    expect(
      Math.abs(afterBox!.x - beforeBox!.x) + Math.abs(afterBox!.y - beforeBox!.y),
    ).toBeGreaterThan(20);
  });

  test('creates a new wire by dragging from an output port to an input port', async ({ page }) => {
    const beforeCount = await page.locator('.joint-link').count();
    const source = await portCenterForNodeText(page, 'Bug Report?', 'out');
    const target = await portCenterForNodeText(page, 'Complete', 'in');

    await page.mouse.move(source.x, source.y);
    await page.mouse.down();
    await page.mouse.move(target.x, target.y, { steps: 16 });
    await page.mouse.up();

    await expect(page.locator('.joint-link')).toHaveCount(beforeCount + 1);
  });

  test('selects an edge and edits its label and condition in the workflow edge panel', async ({
    page,
  }) => {
    await clickFirstLink(page);
    await expect(page.locator('.workflow-edge-panel')).toBeVisible();

    const labelInput = page.locator('.workflow-edge-panel app-input-text input').first();
    await labelInput.fill('happy-path');
    await expect(labelInput).toHaveValue('happy-path');

    const conditionInput = page.locator('.workflow-edge-panel app-input-area textarea').first();
    await conditionInput.fill('#intent == "question"');
    await expect(conditionInput).toHaveValue('#intent == "question"');
  });

  test('supports mouse wheel zoom and blank-canvas drag panning', async ({ page }) => {
    const canvas = page.locator('.flow-canvas');
    const firstNode = page.locator('.joint-element').first();
    const box = await canvas.boundingBox();
    const nodeBox = await firstNode.boundingBox();
    expect(box).not.toBeNull();
    expect(nodeBox).not.toBeNull();

    await page.mouse.move(box!.x + box!.width - 120, box!.y + box!.height - 100);
    await page.mouse.wheel(0, -180);
    await expect
      .poll(async () => {
        const next = await firstNode.boundingBox();
        return Math.round((next?.width ?? 0) * 10);
      })
      .not.toBe(Math.round(nodeBox!.width * 10));

    const beforePanBox = await firstNode.boundingBox();
    expect(beforePanBox).not.toBeNull();
    await page.mouse.move(box!.x + box!.width - 80, box!.y + 80);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width - 20, box!.y + 130, { steps: 8 });
    await page.mouse.up();
    await expect
      .poll(async () => {
        const next = await firstNode.boundingBox();
        return `${Math.round(next?.x ?? 0)}:${Math.round(next?.y ?? 0)}`;
      })
      .not.toBe(`${Math.round(beforePanBox!.x)}:${Math.round(beforePanBox!.y)}`);
  });

  test('navigator controls remain usable and can be reopened from toolbar', async ({ page }) => {
    await expect(page.locator('.flow-navigator')).toBeVisible();
    await page.locator('.flow-navigator__action--close').click();
    await expect(page.locator('.flow-navigator')).not.toBeVisible();

    await page.locator('[data-testid="flow-builder-command-toggle-navigator"] button').click();
    await expect(page.locator('.flow-navigator')).toBeVisible();
    await expect(page.locator('.flow-navigator__viewport')).toBeVisible();
  });
});
