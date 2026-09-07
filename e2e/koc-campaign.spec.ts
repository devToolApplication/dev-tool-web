import { expect, test } from '@playwright/test';

test.describe('KOC Campaign Management & Candidate Approval E2E', () => {
  const mockCampaigns = [
    {
      id: 'camp-101',
      name: 'Chiến dịch KOC Công Nghệ Q3',
      niche: 'TECH',
      targetCount: 5,
      minScore: 75.0,
      workflowStatus: 'USER_TASK',
      approvedKocCount: 0,
      workflowRunId: 'run-9001',
      searchPrompt: 'Tìm các review smartphone, laptop uy tín',
      reviewPrompt: 'Tối thiểu 50k followers, review khách quan',
      createdAt: '2026-09-07T08:00:00Z',
    },
    {
      id: 'camp-102',
      name: 'Chiến dịch KOC Mỹ phẩm Mùa Thu',
      niche: 'BEAUTY',
      targetCount: 3,
      minScore: 70.0,
      workflowStatus: 'COMPLETED',
      approvedKocCount: 3,
      workflowRunId: 'run-9002',
      createdAt: '2026-09-05T10:00:00Z',
    },
  ];

  const mockApprovedCandidates = [
    {
      id: 'cand-1',
      campaignId: 'camp-102',
      externalProfileId: 'fb-creator-1',
      fullName: 'Beauty Creator Lan',
      platform: 'FACEBOOK',
      followerCount: 82000,
      score: 88.5,
      profileUrl: 'https://facebook.com/beauty.lan',
      status: 'ACTIVE',
      createdAt: '2026-09-05T11:00:00Z',
    },
    {
      id: 'cand-2',
      campaignId: 'camp-102',
      externalProfileId: 'fb-creator-2',
      fullName: 'Skincare Reviewer Mai',
      platform: 'FACEBOOK',
      followerCount: 54000,
      score: 79.0,
      profileUrl: 'https://facebook.com/skincare.mai',
      status: 'ACTIVE',
      createdAt: '2026-09-05T11:05:00Z',
    },
  ];

  const mockWorkflowTasks = [
    {
      id: 'task-user-approval-1',
      name: 'Human Approval - Select KOC Candidates',
      taskDefinitionKey: 'userTaskApproveCandidates',
      processInstanceId: 'run-9001',
      assignee: null,
      createTime: '2026-09-07T08:05:00Z',
    },
  ];

  const mockTaskVariables = {
    campaignId: 'camp-101',
    campaignName: 'Chiến dịch KOC Công Nghệ Q3',
    minScore: 75.0,
    targetCount: 5,
    reviewedCandidates: [
      {
        externalProfileId: 'fb-tech-review-1',
        fullName: 'Vinh Cong Nghe',
        profileUrl: 'https://facebook.com/vinh.tech',
        platform: 'FACEBOOK',
        followerCount: 150000,
        score: 92.0,
        analysis: {
          matchReason: 'KOC rất nổi tiếng về smartphone',
          strengths: ['high reach', 'chất lượng video cao'],
          weaknesses: ['chi phí booking cao'],
        },
      },
      {
        externalProfileId: 'fb-tech-review-2',
        fullName: 'Hai Laptop Review',
        profileUrl: 'https://facebook.com/hai.laptop',
        platform: 'FACEBOOK',
        followerCount: 65000,
        score: 78.0,
        analysis: {
          matchReason: 'Chuyên đánh giá phần cứng và laptop',
          strengths: ['kiến thức chuyên sâu', 'tương tác thật'],
          weaknesses: [],
        },
      },
    ],
  };

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('dangerously-skip-permissions', 'true');
    });

    // Mock Campaign Page API
    await page.route('**/v1/admin/koc-campaigns/page*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          data: {
            content: mockCampaigns,
            totalElements: mockCampaigns.length,
            number: 0,
            size: 10,
          },
        }),
      });
    });

    // Mock Candidates for Campaign
    await page.route('**/v1/admin/koc-campaigns/*/candidates', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          data: mockApprovedCandidates,
        }),
      });
    });

    // Mock Create Campaign
    await page.route('**/v1/admin/koc-campaigns', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 200,
            data: {
              id: 'camp-new-created',
              name: body.name,
              niche: body.niche,
              targetCount: body.targetCount,
              minScore: body.minScore,
              workflowStatus: 'RUNNING',
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock Workflow Tasks Page
    await page.route('**/v1/admin/workflows/tasks/page*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          data: {
            content: mockWorkflowTasks,
            totalElements: mockWorkflowTasks.length,
            number: 0,
            size: 50,
          },
        }),
      });
    });

    // Mock Task Variables
    await page.route('**/v1/admin/workflows/tasks/*/variables', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          data: mockTaskVariables,
        }),
      });
    });

    // Mock Complete Task
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

  test('1. Renders campaign list with page shell, toolbar, filter panel and table', async ({ page }) => {
    await page.goto('/koc/campaigns?dangerously-skip-permissions');
    await page.waitForLoadState('networkidle');

    // Page shell & headers
    await expect(page.locator('app-page-shell')).toBeVisible();
    await expect(page.getByText('Chiến dịch KOC Công Nghệ Q3')).toBeVisible();
    await expect(page.getByText('Chiến dịch KOC Mỹ phẩm Mùa Thu')).toBeVisible();

    // Badges & statuses
    await expect(page.getByText('USER_TASK').first()).toBeVisible();
    await expect(page.getByText('COMPLETED').first()).toBeVisible();
  });

  test('2. Opens create campaign dialog and submits new campaign', async ({ page }) => {
    await page.goto('/koc/campaigns?dangerously-skip-permissions');
    await page.waitForLoadState('networkidle');

    // Click 'Khởi tạo Chiến dịch' on toolbar
    const createBtn = page.locator('app-action-toolbar').getByRole('button').first();
    await createBtn.click();

    // Dialog should be open
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Fill form
    const nameInput = dialog.locator('input[type="text"]').first();
    await nameInput.fill('Chiến dịch Test 2026');

    // Submit button
    const submitBtn = dialog.getByRole('button', { name: /Khởi tạo & Chạy quy trình|Create & Start/i });
    await submitBtn.click();

    // Dialog closes
    await expect(dialog).toBeHidden({ timeout: 5000 });
  });

  test('3. Opens drawer to view official approved KOC candidates', async ({ page }) => {
    await page.goto('/koc/campaigns?dangerously-skip-permissions');
    await page.waitForLoadState('networkidle');

    // Click 'Xem KOC đã duyệt' action button on second row
    const viewBtn = page.getByRole('button', { name: /Xem KOC đã duyệt/i }).nth(1);
    await viewBtn.click();

    // Drawer should open in CDK Overlay
    const drawer = page.locator('.app-drawer__panel');
    await expect(drawer).toBeVisible();

    // Approved KOC list visible
    await expect(drawer.getByText('Beauty Creator Lan')).toBeVisible();
    await expect(drawer.getByText('Skincare Reviewer Mai')).toBeVisible();
    await expect(drawer.getByText('fb-creator-1')).toBeVisible();
  });

  test('4. Candidate Approval flow: loads pending user tasks and approves selected KOCs', async ({ page }) => {
    await page.goto('/koc/approval?dangerously-skip-permissions');
    await page.waitForLoadState('networkidle');

    // User task card visible
    await expect(page.getByText('Human Approval - Select KOC Candidates')).toBeVisible();
    await expect(page.getByText('run-9001')).toBeVisible();

    // Click 'Mở danh sách ứng viên'
    const openBtn = page.getByRole('button', { name: /Mở danh sách ứng viên|Review Candidates/i });
    await openBtn.click();

    // Drawer opens with candidates
    const drawer = page.locator('.app-drawer__panel');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Vinh Cong Nghe')).toBeVisible();
    await expect(drawer.getByText('Hai Laptop Review')).toBeVisible();

    // Approve selected button
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const approveBtn = drawer.getByRole('button', { name: 'Phê duyệt KOC đã chọn' });
    await expect(approveBtn).toBeEnabled();
    await approveBtn.click();

    // Drawer closes after approval
    await expect(drawer).toBeHidden({ timeout: 5000 });
  });

  test('5. Responsive mobile viewport: drawer and toolbar adapt gracefully', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/koc/campaigns?dangerously-skip-permissions');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('app-page-shell')).toBeVisible();
    const viewBtn = page.getByRole('button', { name: /Xem KOC đã duyệt/i }).first();
    await viewBtn.click();

    const drawer = page.locator('.app-drawer__panel');
    await expect(drawer).toBeVisible();
  });
});
