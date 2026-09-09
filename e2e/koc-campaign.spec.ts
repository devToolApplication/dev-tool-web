import { expect, Page, Route, test } from '@playwright/test';

const campaigns = [
  {
    id: 'camp-101',
    name: 'Technology KOC Campaign',
    niche: 'TECH',
    targetCount: 5,
    minScore: 75,
    workflowStatus: 'USER_TASK',
    approvedKocCount: 0,
    workflowRunId: 'run-9001',
    createdAt: '2026-09-07T08:00:00Z',
  },
  {
    id: 'camp-102',
    name: 'Beauty KOC Campaign',
    niche: 'BEAUTY',
    targetCount: 3,
    minScore: 70,
    workflowStatus: 'COMPLETED',
    approvedKocCount: 3,
    workflowRunId: 'run-9002',
    createdAt: '2026-09-05T10:00:00Z',
  },
];

test.describe('KOC campaign management', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('dangerously-skip-permissions', 'true');
      window.localStorage.setItem('app-language', 'en');
    });
    await mockCampaignApi(page);
  });

  test('renders campaigns and opens the approved-candidate drawer', async ({ page }) => {
    await page.goto('/koc/campaigns?dangerously-skip-permissions=true');

    await expect(page.getByText('Technology KOC Campaign')).toBeVisible();
    await expect(page.getByText('Beauty KOC Campaign')).toBeVisible();

    await page.getByRole('button', { name: /View Approved KOCs/i }).nth(1).click();

    const drawer = page.locator('.app-drawer__panel');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Beauty Creator')).toBeVisible();
  });

  test('creates a campaign through the shared dialog', async ({ page }) => {
    await page.goto('/koc/campaigns?dangerously-skip-permissions=true');

    await page.locator('app-action-toolbar').getByRole('button').first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('input[type="text"]').first().fill('New KOC Campaign');
    await dialog.getByRole('button', { name: /Create & Start/i }).click();

    await expect(dialog).toBeHidden();
  });

  test('opens the new user-task inbox filtered by campaign', async ({ page }) => {
    await page.route('**/ai-agent-mcrs/v1/user-tasks**', async (route) => {
      await fulfillJson(route, {
        data: [],
        metadata: { totalElements: 0, pageNumber: 0, pageSize: 10 },
      });
    });
    await page.goto('/koc/campaigns?dangerously-skip-permissions=true');

    await page.locator('.table-actions__more-wrap button').first().click();
    await page
      .locator('.table-actions__menu')
      .getByRole('button', { name: /Approve Candidates/i })
      .click();

    await expect(page).toHaveURL(/\/tasks\?.*businessKey=camp-101/);
  });
});

async function mockCampaignApi(page: Page): Promise<void> {
  await page.route('**/ai-agent-mcrs/v1/admin/koc-campaigns**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === 'OPTIONS') {
      await fulfillJson(route, null, 204);
      return;
    }

    if (request.method() === 'GET' && url.pathname.endsWith('/koc-campaigns/page')) {
      await fulfillJson(route, {
        data: campaigns,
        metadata: {
          totalElements: campaigns.length,
          pageNumber: 0,
          pageSize: 10,
        },
      });
      return;
    }

    if (request.method() === 'GET' && url.pathname.endsWith('/candidates')) {
      await fulfillJson(route, [
        {
          id: 'candidate-1',
          campaignId: 'camp-102',
          externalProfileId: 'profile-1',
          fullName: 'Beauty Creator',
          platform: 'FACEBOOK',
          followerCount: 82000,
          score: 88.5,
          status: 'ACTIVE',
          createdAt: '2026-09-05T11:00:00Z',
        },
      ]);
      return;
    }

    if (request.method() === 'POST' && url.pathname.endsWith('/koc-campaigns')) {
      const body = request.postDataJSON() as Record<string, unknown>;
      await fulfillJson(route, {
        id: 'camp-new',
        ...body,
        workflowStatus: 'RUNNING',
      });
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${request.method()} ${url.pathname}` }, 404);
  });
}

async function fulfillJson(route: Route, data: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization',
      'content-type': 'application/json',
    },
    body: status === 204 ? '' : JSON.stringify({ data }),
  });
}
