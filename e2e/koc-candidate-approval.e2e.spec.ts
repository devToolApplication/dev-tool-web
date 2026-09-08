import { expect, test } from '@playwright/test';

test.describe('KOC Candidate Approval E2E', () => {
  const mockTasks = [
    {
      id: 'task-approve-01',
      name: 'Human Approval - Select KOC Candidates',
      taskDefinitionKey: 'userTaskApproveCandidates',
      processInstanceId: 'run-koc-100',
      assignee: null,
    },
    {
      id: 'task-decision-02',
      name: 'Decision: Find More or Stop',
      taskDefinitionKey: 'userTaskDiscoveryDecision',
      processInstanceId: 'run-koc-101',
      assignee: null,
    },
    {
      id: 'task-2fa-03',
      name: 'User Approval (Cham so 2FA tren dien thoai)',
      taskDefinitionKey: 'userTaskManualApprove',
      processInstanceId: 'run-fb-102',
      assignee: 'admin',
    },
  ];

  const mockApproveVariables = {
    reviewedCandidates: [
      {
        externalProfileId: 'fb-koc-01',
        fullName: 'Reviewer Công Nghệ X',
        profileUrl: 'https://facebook.com/tech_x',
        platform: 'FACEBOOK',
        followerCount: 75000,
        score: 85.0,
        strengths: ['Tương tác cao', 'Review trung thực'],
        matchReason: 'Phù hợp chiến dịch phụ kiện công nghệ',
      },
    ],
    minScore: 70.0,
  };

  const mockDecisionVariables = {
    discoveryRound: 2,
    roundLimit: 3,
    qualifiedCount: 4,
    targetCandidates: 10,
    reviewedCandidates: [
      {
        externalProfileId: 'fb-koc-02',
        fullName: 'Beauty Blogger Y',
        profileUrl: 'https://facebook.com/beauty_y',
        platform: 'FACEBOOK',
        followerCount: 120000,
        score: 90.0,
      },
    ],
  };

  const mock2faVariables = {
    twoFactorCode: '92',
    checkpointCode: '92',
  };

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('dangerously-skip-permissions', 'true');
    });

    // Mock Tasks Page API
    await page.route('**/v1/admin/workflows/tasks/page*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          data: {
            content: mockTasks,
            totalElements: mockTasks.length,
            number: 0,
            size: 50,
          },
        }),
      });
    });

    // Mock Task Variables API
    await page.route('**/v1/admin/workflows/tasks/*/variables', async (route) => {
      const url = route.request().url();
      let vars: Record<string, unknown> = mockApproveVariables;
      if (url.includes('task-decision-02')) {
        vars = mockDecisionVariables;
      } else if (url.includes('task-2fa-03')) {
        vars = mock2faVariables;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          data: vars,
        }),
      });
    });

    // Mock Task Complete API
    await page.route('**/v1/admin/workflows/tasks/*/complete', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          data: true,
        }),
      });
    });
  });

  test('should display all UserTasks and open candidate approval drawer', async ({ page }) => {
    await page.goto('/koc/approval?dangerously-skip-permissions=true');

    // 1. Verify all 3 tasks are visible
    await expect(page.getByText('Human Approval - Select KOC Candidates')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Decision: Find More or Stop')).toBeVisible();
    await expect(page.getByText('User Approval (Cham so 2FA tren dien thoai)')).toBeVisible();

    // 2. Open Candidate Approval drawer
    const openButtons = page.getByRole('button', { name: /Mở danh sách ứng viên|Review Candidates|Phê duyệt/i });
    await openButtons.first().click();

    // 3. Verify drawer content and candidate
    await expect(page.getByText('Reviewer Công Nghệ X')).toBeVisible();
    await expect(page.getByText('ID: fb-koc-01')).toBeVisible();
    await expect(page.getByText('75.0k')).toBeVisible();
  });

  test('should open decision task and show round progress and decision buttons', async ({ page }) => {
    await page.goto('/koc/approval?dangerously-skip-permissions=true');

    await expect(page.getByText('Decision: Find More or Stop')).toBeVisible({ timeout: 30000 });

    // Click decision task button
    const decisionTaskCard = page.locator('div').filter({ hasText: 'Decision: Find More or Stop' }).first();
    const actionBtn = decisionTaskCard.getByRole('button', { name: /Quyết định tìm kiếm|Xử lý Quyết định|Decision/i });
    await actionBtn.click();

    // Verify decision round stats
    await expect(page.getByText('2 / 3')).toBeVisible();
    await expect(page.getByRole('button', { name: /Tìm kiếm tiếp|Find More/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Dừng & Chuyển sang phê duyệt|Stop & Proceed/i }).first()).toBeVisible();
  });

  test('should open manual 2FA task and show verification code', async ({ page }) => {
    await page.goto('/koc/approval?dangerously-skip-permissions=true');

    await expect(page.getByText('User Approval (Cham so 2FA tren dien thoai)')).toBeVisible({ timeout: 30000 });

    const twoFaCard = page.locator('div').filter({ hasText: 'User Approval (Cham so 2FA tren dien thoai)' }).first();
    const actionBtn = twoFaCard.getByRole('button', { name: /Xác minh 2FA|2FA Verification|Phê duyệt/i });
    await actionBtn.click();

    // Verify 2FA code is displayed
    await expect(page.getByText('92')).toBeVisible();
    await expect(page.getByRole('button', { name: /Xác nhận đã chạm số|Confirm 2FA/i }).first()).toBeVisible();
  });

  test('should display active campaign filter banner when campaignId queryParam provided', async ({ page }) => {
    await page.goto('/koc/approval?campaignId=camp-tech-2026&dangerously-skip-permissions=true');

    // Verify banner with campaign ID
    await expect(page.getByText('camp-tech-2026')).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('button', { name: /Xem tất cả nhiệm vụ|View all tasks/i })).toBeVisible();
  });
});
