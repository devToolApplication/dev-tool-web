import { expect, type Route, test } from '@playwright/test';

interface MockCampaignSummary {
  campaignId: string;
  name: string;
  code: string;
  status: 'DRAFT' | 'READY' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'STOPPED' | 'BLOCKED';
  acceptedTarget: number;
  counters: {
    discovered: number;
    unique: number;
    screened: number;
    rejected: number;
    review: number;
    accepted: number;
    waiting: number;
  };
  lastActivityAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MockCampaignDetail extends MockCampaignSummary {
  description?: string;
  version: number;
  discoveryExecution: {
    agentCode: string;
    provider: string;
  };
  topRejectionReasons?: Array<{ reason: string; count: number }>;
}

/* ponytail: campaign flow uses route mocks for full list-to-detail journey; upgrade to shared backend seed when end-to-end API harness is live. */
test.describe('KOC Campaign Flow E2E', () => {
  test('lists campaigns and navigates to campaign detail page', async ({ page }) => {
    const campaignId = 'camp-e2e-1';
    const mockCampaignSummary: MockCampaignSummary = {
      campaignId,
      name: 'Summer Tech Launch 2026',
      code: 'CAMP-SUMMER-26',
      status: 'RUNNING',
      acceptedTarget: 50,
      counters: {
        discovered: 120,
        unique: 100,
        screened: 80,
        rejected: 20,
        review: 10,
        accepted: 35,
        waiting: 15,
      },
      lastActivityAt: '2026-08-23T09:00:00.000Z',
      createdAt: '2026-08-20T00:00:00.000Z',
      updatedAt: '2026-08-23T09:00:00.000Z',
    };

    const mockCampaignDetail: MockCampaignDetail = {
      ...mockCampaignSummary,
      version: 1,
      discoveryExecution: {
        agentCode: 'facebook-discovery',
        provider: 'codex',
      },
      topRejectionReasons: [
        { reason: 'FOLLOWER_COUNT_TOO_LOW', count: 12 },
        { reason: 'ENGAGEMENT_BELOW_THRESHOLD', count: 8 },
      ],
    };

    await page.addInitScript(() => {
      window.localStorage.setItem('dangerously-skip-permissions', 'true');
    });

    await page.route('**/ai-agent-mcrs/v1/admin/koc/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (method === 'GET' && url.includes('/campaigns/page')) {
        await fulfillJson(route, {
          data: [mockCampaignSummary],
          metadata: {
            pageNumber: 0,
            pageSize: 20,
            totalElements: 1,
            totalPages: 1,
          },
        });
        return;
      }

      if (method === 'GET' && url.includes(`/campaigns/${campaignId}/strategies`)) {
        await fulfillJson(route, []);
        return;
      }

      if (method === 'GET' && url.includes('/candidates/page')) {
        await fulfillJson(route, {
          data: [],
          metadata: { pageNumber: 0, pageSize: 5, totalElements: 0, totalPages: 0 },
        });
        return;
      }

      if (method === 'GET' && url.includes(`/campaigns/${campaignId}`)) {
        await fulfillJson(route, mockCampaignDetail);
        return;
      }

      await fulfillJson(route, {});
    });

    await page.goto('/ai-agent-mcrs/koc/campaigns?dangerously-skip-permissions');
    await expect(page.locator('app-koc-campaign-list')).toBeVisible();
    await expect(page.getByText('Summer Tech Launch 2026')).toBeVisible();

    await page.getByText('Summer Tech Launch 2026').click();

    await page.waitForURL(`**/ai-agent-mcrs/koc/campaigns/${campaignId}*`);
    await expect(page.locator('app-koc-campaign-detail')).toBeVisible();
    await expect(page.getByText('CAMP-SUMMER-26')).toBeVisible();
    await expect(page.getByText('35 / 50')).toBeVisible();
  });
});

async function fulfillJson(route: Route, data: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization',
      'content-type': 'application/json',
    },
    body: status === 204 ? '' : JSON.stringify({ data }),
  });
}
