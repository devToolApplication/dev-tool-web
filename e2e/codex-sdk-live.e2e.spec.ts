import { test, expect } from '@playwright/test';

test.describe('Codex SDK Live Stream & Context Inspection', () => {
  test('should display thread, view requestContext, outputSchema, and attach live stream', async ({ page }) => {
    // 1. Mock threads list API (exact match on /codex-sdk/threads or with query params)
    await page.route(/\/ai-agent-mcrs\/v1\/codex-sdk\/threads(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          data: {
            data: [
              {
                id: 'thread-running-123',
                previewText: 'Tìm kiếm ứng viên KOC tiềm năng ngành FMCG',
                turnCount: 2,
                createdAt: '2026-09-08T08:00:00Z',
                updatedAt: '2026-09-08T08:01:00Z',
              },
            ],
            nextCursor: null,
          },
        }),
      });
    });

    // 2. Mock agents catalog API
    await page.route(/\/ai-agent-mcrs\/v1\/codex-sdk\/agents/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          data: [
            {
              agentCode: 'facebook-candidate-discovery',
              displayName: 'Facebook Candidate Discovery',
              defaultProvider: 'claude',
              supportedProviders: [
                { provider: 'claude', available: true },
                { provider: 'codex', available: true },
              ],
            },
          ],
        }),
      });
    });

    // 3. Mock live SSE endpoint (must be registered or matched specifically)
    await page.route(/\/ai-agent-mcrs\/v1\/codex-sdk\/threads\/thread-running-123\/live/, async (route) => {
      const sseContent = [
        'event: message\ndata: {"sequence":1,"type":"stderr","data":"[Crawler] Đang quét các bài đăng gần nhất"}\n\n',
        'event: message\ndata: {"sequence":2,"type":"stdout","data":"Đã tìm thấy 3 bài đăng phù hợp"}\n\n',
        'event: done\ndata: Stream finished.\n\n',
      ].join('');

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
        body: sseContent,
      });
    });

    // 4. Mock thread detail API with turn containing requestContext, outputSchema, and status streaming
    await page.route(/\/ai-agent-mcrs\/v1\/codex-sdk\/threads\/thread-running-123$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          data: {
            id: 'thread-running-123',
            turns: [
              {
                id: 'turn-user-1',
                role: 'user',
                content: 'Tìm 5 KOC ngành FMCG có tương tác trên 5%',
                createdAt: '2026-09-08T08:00:00Z',
                status: 'completed',
                requestContext: {
                  campaignId: 'camp-fmcg-001',
                  niche: 'FMCG',
                  targetCount: 5,
                  minScore: 75.5,
                },
                outputSchema: {
                  type: 'object',
                  properties: {
                    candidates: { type: 'array' },
                  },
                  required: ['candidates'],
                },
              },
              {
                id: 'turn-asst-1',
                role: 'assistant',
                content: 'Khởi động tiến trình quét ứng viên...',
                createdAt: '2026-09-08T08:00:05Z',
                status: 'streaming',
                preflight: {
                  agentCode: 'facebook-candidate-discovery',
                  provider: 'claude',
                  status: 'READY',
                },
                stderrLog: ['[Facebook MCP] Đang mở phiên đăng nhập Facebook'],
              },
            ],
          },
        }),
      });
    });

    // Navigate to codex-sdk threads page
    await page.goto('/codex-sdk/threads?dangerously-skip-permissions=true');

    // Wait for the table row to appear and click 'Xem chi tiết' button to open thread drawer
    const viewDetailBtn = page.getByRole('button', { name: /Xem chi tiết|View detail/i });
    await expect(viewDetailBtn).toBeVisible({ timeout: 30000 });
    await viewDetailBtn.click();

    // Verify drawer is open
    const drawer = page.locator('.codex-chat-drawer-body');
    await expect(drawer).toBeVisible();

    // Check requestContext collapsible toggle
    const contextButton = page.getByRole('button', { name: /Ngữ cảnh yêu cầu|Request Context/i });
    await expect(contextButton).toBeVisible();
    await contextButton.click();
    await expect(page.getByText('camp-fmcg-001')).toBeVisible();

    // Check outputSchema collapsible toggle
    const schemaButton = page.getByRole('button', { name: /Cấu trúc đầu ra|Output Schema/i });
    await expect(schemaButton).toBeVisible();
    await schemaButton.click();
    await expect(page.getByText('"candidates"')).toBeVisible();

    // Check diagnostics / stderrLog collapsible
    const diagButton = page.getByRole('button', { name: /Diagnostics|Chẩn đoán/i });
    await expect(diagButton).toBeVisible();
    await diagButton.click();
    await expect(page.getByText('[Crawler] Đang quét các bài đăng gần nhất')).toBeVisible();

    // Verify live stream stdout content rendered into turn content
    await expect(page.getByText('Đã tìm thấy 3 bài đăng phù hợp')).toBeVisible();
  });
});

