import { expect, type Route, test } from '@playwright/test';

interface MockIncidentDetail {
  incidentId: string;
  dependencyKey: string;
  status: 'BLOCKED' | 'RECOVERING' | 'HEALTHY' | 'OPEN' | 'RESOLVED';
  health: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  waitingWorkflows: number;
  affectedCampaigns: number;
  agentCode?: string;
  provider?: string;
  startedAt?: string;
  lastFailureAt?: string;
  stableErrorCode: string;
  businessImpact: string;
  affectedProviders: string[];
}

interface MockRecoveryProgress {
  recovered: number;
  running: number;
  queued: number;
  failed: number;
}

interface IncidentApiState {
  getCalls: number;
  testDependencyCalls: number;
  markFixedCalls: number;
  candidateRetryCalls: number;
  incident: MockIncidentDetail;
  recovery: MockRecoveryProgress;
}

/* ponytail: incident test uses synthetic route mocking; upgrade to shared backend fixture when test harness is wired. */
test.describe('KOC Incident Recovery E2E', () => {
  test('displays incident details and drives single-call recovery progress without candidate retries', async ({
    page,
  }) => {
    const apiState: IncidentApiState = {
      getCalls: 0,
      testDependencyCalls: 0,
      markFixedCalls: 0,
      candidateRetryCalls: 0,
      incident: {
        incidentId: 'incident-1',
        dependencyKey: 'openai.gpt-4o',
        status: 'BLOCKED',
        health: 'UNHEALTHY',
        waitingWorkflows: 15,
        affectedCampaigns: 3,
        agentCode: 'DISCOVERY_AGENT',
        provider: 'OPENAI',
        startedAt: '2026-08-23T08:00:00.000Z',
        lastFailureAt: '2026-08-23T08:05:00.000Z',
        stableErrorCode: 'RATE_LIMIT_EXCEEDED',
        businessImpact: 'Discovery workflows paused due to provider rate limit',
        affectedProviders: ['openai', 'apify'],
      },
      recovery: {
        recovered: 12,
        running: 3,
        queued: 0,
        failed: 0,
      },
    };

    await page.addInitScript(() => {
      window.localStorage.setItem('dangerously-skip-permissions', 'true');
    });

    await page.route('**/ai-agent-mcrs/v1/admin/koc/**', async (route) => {
      const request = route.request();
      const method = request.method();
      const url = request.url();

      if (url.includes('/candidates/') && url.includes('/retry')) {
        apiState.candidateRetryCalls += 1;
        await fulfillJson(route, { success: true });
        return;
      }

      if (method === 'GET' && url.includes('/incidents/incident-1')) {
        apiState.getCalls += 1;
        await fulfillJson(route, apiState.incident);
        return;
      }

      if (method === 'POST' && url.includes('/incidents/incident-1/test-dependency')) {
        apiState.testDependencyCalls += 1;
        apiState.incident = {
          ...apiState.incident,
          health: 'HEALTHY',
        };
        await fulfillJson(route, apiState.incident);
        return;
      }

      if (method === 'POST' && url.includes('/incidents/incident-1/mark-fixed')) {
        apiState.markFixedCalls += 1;
        apiState.incident = {
          ...apiState.incident,
          status: 'RECOVERING',
        };
        await fulfillJson(route, apiState.recovery);
        return;
      }

      await fulfillJson(route, {});
    });

    await page.goto('/ai-agent-mcrs/koc/incidents/incident-1?dangerously-skip-permissions');
    await expect(page.locator('app-koc-incident-detail')).toBeVisible();

    await expect(page.getByText('openai.gpt-4o')).toBeVisible();
    await expect(page.getByText('RATE_LIMIT_EXCEEDED')).toBeVisible();
    await expect(page.getByText('Discovery workflows paused due to provider rate limit')).toBeVisible();

    const testDependencyBtn = page
      .locator('app-button')
      .filter({ hasText: /Test connection|Kiem tra ket noi/i })
      .locator('button');
    await expect(testDependencyBtn).toBeVisible();
    await expect(testDependencyBtn).toBeEnabled();
    await testDependencyBtn.click();

    expect(apiState.testDependencyCalls).toBe(1);

    const markFixedBtn = page
      .locator('app-button')
      .filter({ hasText: /Mark issue fixed|Danh dau da sua/i })
      .locator('button');
    await expect(markFixedBtn).toBeVisible();
    await expect(markFixedBtn).toBeEnabled();
    await markFixedBtn.click();

    expect(apiState.markFixedCalls).toBe(1);
    expect(apiState.candidateRetryCalls).toBe(0);

    await expect(page.getByText(/Automatic recovery progress|Tien do phuc hoi/i)).toBeVisible();
    await expect(page.locator('.incident-detail__recovery-grid')).toContainText('12');
    await expect(page.locator('.incident-detail__recovery-grid')).toContainText('3');
    await expect(page.locator('app-koc-status-badge').filter({ hasText: /Needs attention|RECOVERING|Can chu y/i })).toBeVisible();
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
