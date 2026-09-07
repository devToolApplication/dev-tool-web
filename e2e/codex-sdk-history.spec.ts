import { expect, test } from '@playwright/test';

test.describe('Codex SDK History & Workbench E2E', () => {
  const mockThreads = [
    {
      id: 'thread-test-101',
      previewText: 'Kiểm tra chạy kịch bản thử nghiệm',
      turnCount: 4,
      updatedAt: '2026-09-06T08:00:00Z',
      archived: false,
    },
    {
      id: 'thread-test-102',
      previewText: 'Hỗ trợ debug luồng xử lý AI model',
      turnCount: 2,
      updatedAt: '2026-09-06T08:15:00Z',
      archived: false,
    },
  ];

  const mockHistory = [
    {
      id: 'turn-1',
      role: 'user',
      content: 'Chào bạn, hãy chạy thử tool kiểm tra trạng thái',
      createdAt: '2026-09-06T08:00:00Z',
    },
    {
      id: 'turn-2',
      role: 'assistant',
      content: 'Đã hoàn tất kiểm tra trạng thái hệ thống.',
      toolCalls: [
        {
          name: 'checkSystemHealth',
          input: { checkType: 'all' },
          output: { status: 'healthy', memory: '45%' },
        },
      ],
      createdAt: '2026-09-06T08:00:05Z',
    },
  ];

  const PAGE_URL = '/codex-sdk/threads?dangerously-skip-permissions';

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('dangerously-skip-permissions', 'true');
    });

    // Mock API get agents
    await page.route('**/v1/codex-sdk/agents*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          data: [
            {
              agentCode: 'facebook-agent',
              displayName: 'Facebook Agent',
              defaultProvider: 'codex',
              supportedProviders: [
                { provider: 'codex', available: true },
                { provider: 'claude', available: true },
              ],
            },
            {
              agentCode: 'claude-assistant',
              displayName: 'Claude Assistant',
              defaultProvider: 'claude',
              supportedProviders: [{ provider: 'claude', available: true }],
            },
          ],
        }),
      });
    });

    // Mock API get threads
    await page.route('**/v1/codex-sdk/threads*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          data: {
            data: mockThreads,
            nextCursor: null,
            total: mockThreads.length,
          },
        }),
      });
    });

    // Mock API get thread history
    await page.route('**/v1/codex-sdk/threads/thread-test-101*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          data: {
            id: 'thread-test-101',
            turns: mockHistory,
          },
        }),
      });
    });
  });

  test('TC-FE-E2E-01: Renders page shell, toolbar and table', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('app-page-shell')).toBeVisible();
    await expect(page.locator('app-action-toolbar')).toBeVisible();
    await expect(page.locator('app-table')).toBeVisible();
    await expect(page.getByText('thread-test-101').first()).toBeVisible();
  });

  test('TC-FE-E2E-02: Opens and closes workbench drawer', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.getByText('thread-test-101').first()).toBeVisible();

    // Click row or detail action
    const detailBtn = page.getByRole('button', { name: 'Xem chi tiết' }).first();
    await detailBtn.click();

    // Drawer opens in CDK Overlay
    await expect(page.locator('.app-drawer__panel')).toBeVisible();
    await expect(page.getByText('Codex SDK Workbench')).toBeVisible();
    await expect(page.getByText('Chào bạn, hãy chạy thử tool')).toBeVisible();

    // Close drawer
    const closeBtn = page.locator('.app-drawer__header app-button button, .app-drawer .app-drawer__backdrop').first();
    await closeBtn.click();
    await expect(page.locator('.app-drawer__panel')).toBeHidden();
  });

  test('TC-FE-E2E-03: Responsive Drawer Mobile-First (< 768px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(PAGE_URL);
    await expect(page.getByText('thread-test-101').first()).toBeVisible();

    const detailBtn = page.getByRole('button', { name: 'Xem chi tiết' }).first();
    await detailBtn.click();

    await expect(page.locator('.app-drawer__panel')).toBeVisible();
    const drawerBox = await page.locator('.app-drawer__panel').boundingBox();
    if (drawerBox) {
      expect(drawerBox.width).toBeGreaterThanOrEqual(360);
    }
  });

  test('TC-FE-E2E-04: Renders preflight, reasoning and clean content in assistant turn', async ({ page }) => {
    const mockRawNdjsonHistory = [
      {
        id: 'turn-ndjson-1',
        role: 'assistant',
        content: `{"at":"2026-09-06T08:21:02.190Z","type":"heartbeat"}
{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"Cấu hình Facebook Agent đã nạp thành công."}}
{"type":"item.completed","item":{"id":"item_1","type":"reasoning","text":"Analyzing instructions and tools..."}}`,
        createdAt: '2026-09-06T08:00:05Z',
        preflight: {
          status: 'READY',
          agentCode: 'facebook-agent',
          provider: 'codex',
        },
      },
    ];

    await page.route('**/v1/codex-sdk/threads/thread-test-102*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          data: {
            id: 'thread-test-102',
            turns: mockRawNdjsonHistory,
          },
        }),
      });
    });

    await page.goto(PAGE_URL);
    await expect(page.getByText('thread-test-102').first()).toBeVisible();

    const detailButtons = page.getByRole('button', { name: 'Xem chi tiết' });
    await detailButtons.nth(1).click();

    await expect(page.locator('.app-drawer__panel')).toBeVisible();
    // Verify Preflight chip
    await expect(page.getByText('facebook-agent (codex)')).toBeVisible();
    // Verify Clean parsed text (no raw json brackets visible in bubble text)
    await expect(page.getByText('Cấu hình Facebook Agent đã nạp thành công.')).toBeVisible();
    // Verify Reasoning accordion button extracted from item_1
    await expect(page.getByText('Quá trình suy luận (Reasoning)')).toBeVisible();
  });

  test('TC-FE-E2E-05: Fetches agents dynamically from BE and populates agent and provider options', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.getByText('thread-test-101').first()).toBeVisible();

    const detailBtn = page.getByRole('button', { name: 'Xem chi tiết' }).first();
    await detailBtn.click();

    await expect(page.locator('.app-drawer__panel')).toBeVisible();
    // Agent selector contains dynamic agent label from backend
    await expect(page.locator('#agent-select')).toContainText('Facebook Agent (facebook-agent)');
  });
});
