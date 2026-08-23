import { expect, test } from '@playwright/test';

const TABLE_STORY_URL =
  'http://127.0.0.1:6006/iframe.html?id=shared-ui-table--selection-and-controls&viewMode=story';

test.describe('Shared table frozen columns', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 720, height: 640 });
    await page.goto(TABLE_STORY_URL);
    await page.waitForSelector('app-table', { timeout: 30000 });
    await page.waitForSelector('.app-table-scroller', { timeout: 30000 });
  });

  test('keeps the configured action column visible while scrolling horizontally', async ({
    page,
  }) => {
    const scroller = page.locator('.app-table-scroller').first();
    const actionHeader = page.locator('thead .app-table-cell--frozen-right').first();
    const actionCell = page.locator('tbody .app-table-cell--frozen-right').first();

    await expect(actionHeader).toContainText('Actions');
    await expect(actionCell.getByRole('button').first()).toBeVisible();

    await scroller.evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
    });

    await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);

    const position = await actionHeader.evaluate((element) => getComputedStyle(element).position);
    const scrollerBox = await scroller.boundingBox();
    const headerBox = await actionHeader.boundingBox();
    const cellBox = await actionCell.boundingBox();

    expect(position).toBe('sticky');
    expect(scrollerBox).not.toBeNull();
    expect(headerBox).not.toBeNull();
    expect(cellBox).not.toBeNull();
    expect(headerBox!.x + headerBox!.width).toBeLessThanOrEqual(
      scrollerBox!.x + scrollerBox!.width + 2,
    );
    expect(headerBox!.x).toBeGreaterThanOrEqual(scrollerBox!.x - 2);
    expect(cellBox!.x + cellBox!.width).toBeLessThanOrEqual(
      scrollerBox!.x + scrollerBox!.width + 2,
    );
    expect(cellBox!.x).toBeGreaterThanOrEqual(scrollerBox!.x - 2);
  });

  test('does not offer non-hideable action columns in the column chooser', async ({ page }) => {
    const columnChooser = page.locator('.table-toolbar__columns').first();

    await columnChooser.click();
    await expect(columnChooser.locator('label').first()).toBeVisible();
    await expect(columnChooser.locator('label').filter({ hasText: 'Actions' })).toHaveCount(0);
  });
});
