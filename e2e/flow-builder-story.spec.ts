import { expect, test, Page } from '@playwright/test';

const SINGLE_RULE_REF_STORY_URL =
  'http://127.0.0.1:6006/iframe.html?id=shared-ui-flowbuilder--single-rule-ref-initial-fit&viewMode=story';
const HTML_PORT_CONNECTION_STORY_URL =
  'http://127.0.0.1:6006/iframe.html?id=shared-ui-flowbuilder--html-port-connection&viewMode=story';

async function openStory(page: Page, url = SINGLE_RULE_REF_STORY_URL): Promise<string[]> {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });

  await page.goto(url);
  await page.waitForSelector('.flow-builder', { timeout: 30000 });
  await page.waitForSelector('.joint-element', { timeout: 30000 });
  return browserErrors;
}

test.describe('Flow Builder Story Regression', () => {
  test('renders the initial rule node in the main canvas instead of only the plus button', async ({
    page,
  }) => {
    const browserErrors = await openStory(page);
    expect(browserErrors, browserErrors.join('\n')).toHaveLength(0);

    const node = page.locator('.joint-element').first();
    await expect(node).toBeVisible();
    await expect(node).toContainText('TREND_IS_BEARISH_INTERNAL');
    await expect(page.locator('.flow-add-button__trigger')).toBeHidden();
  });

  test('does not place the initial rule node at the canvas top-left corner after fit', async ({
    page,
  }) => {
    await openStory(page);

    const canvasBox = await page.locator('.flow-canvas').boundingBox();
    const nodeBox = await page.locator('.joint-element').first().boundingBox();

    expect(canvasBox).not.toBeNull();
    expect(nodeBox).not.toBeNull();
    expect(nodeBox!.x - canvasBox!.x).toBeGreaterThan(80);
    expect(nodeBox!.y - canvasBox!.y).toBeGreaterThan(80);
  });

  test('recovers when the JointJS paper is stuck at a stale 1px size', async ({ page }) => {
    await openStory(page);

    await page.evaluate(() => {
      const builder = document.querySelector('app-flow-builder');
      const component = (
        window as Window & { ng?: { getComponent?: (element: Element | null) => unknown } }
      ).ng?.getComponent?.(builder) as
        | {
            canvas?: {
              engineInstance?: {
                paper?: { setDimensions?: (width: number, height: number) => void };
              };
            };
          }
        | undefined;
      component?.canvas?.engineInstance?.paper?.setDimensions(1, 1);
    });

    await expect
      .poll(async () => {
        const box = await page.locator('.flow-canvas__paper').boundingBox();
        return Math.round(box?.width ?? 0);
      })
      .toBe(1);

    await page.locator('[data-testid="flow-builder-command-fit"] button').click();

    await expect
      .poll(async () => {
        const box = await page.locator('.flow-canvas__paper').boundingBox();
        return Math.round(box?.width ?? 0);
      })
      .toBeGreaterThan(300);
    await expect
      .poll(async () => {
        const box = await page.locator('.flow-canvas__paper').boundingBox();
        return Math.round(box?.height ?? 0);
      })
      .toBeGreaterThan(300);

    const canvasBox = await page.locator('.flow-canvas').boundingBox();
    const nodeBox = await page.locator('.joint-element').first().boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(nodeBox).not.toBeNull();
    expect(nodeBox!.x).toBeGreaterThan(canvasBox!.x);
    expect(nodeBox!.y).toBeGreaterThan(canvasBox!.y);
    expect(nodeBox!.x + nodeBox!.width).toBeLessThan(canvasBox!.x + canvasBox!.width);
    expect(nodeBox!.y + nodeBox!.height).toBeLessThan(canvasBox!.y + canvasBox!.height);
  });

  test('allows dragging a link from an output port to an input port', async ({ page }) => {
    const browserErrors = await openStory(page, HTML_PORT_CONNECTION_STORY_URL);
    expect(browserErrors, browserErrors.join('\n')).toHaveLength(0);

    const sourcePort = page.locator('svg [port="out"]').first();
    const targetPort = page.locator('svg [port="in"]').first();
    await expect(sourcePort).toBeVisible();
    await expect(targetPort).toBeVisible();

    const sourceBox = await sourcePort.boundingBox();
    const targetBox = await targetPort.boundingBox();
    expect(sourceBox).not.toBeNull();
    expect(targetBox).not.toBeNull();

    await page.mouse.move(
      sourceBox!.x + sourceBox!.width / 2,
      sourceBox!.y + sourceBox!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      targetBox!.x + targetBox!.width / 2,
      targetBox!.y + targetBox!.height / 2,
      { steps: 12 },
    );
    await page.mouse.up();

    await expect(page.locator('.joint-link')).toHaveCount(1);
  });
});
