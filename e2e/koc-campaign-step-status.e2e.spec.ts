import { expect, test } from '@playwright/test';

test.describe('KOC Campaign Detailed Step Status E2E', () => {
  const mockCampaigns = [
    {
      id: 'camp-running-01',
      name: 'Chiến dịch FMCG Tết 2026',
      niche: 'FOOD',
      targetCount: 10,
      minScore: 70.0,
      workflowRunId: 'run-fmcg-999',
      workflowStatus: 'RUNNING',
      currentStep: 'AI_SEARCH',
      currentStepTitle: 'Quét tìm KOC',
      currentRound: 2,
      maxRounds: 3,
      stepDetail: 'Đang quét bài đăng Facebook theo từ khóa FMCG',
      approvedKocCount: 4,
      createdAt: '2026-09-08T08:00:00Z',
    },
    {
      id: 'camp-waiting-02',
      name: 'Chiến dịch Thời trang Thu Đông',
      niche: 'FASHION',
      targetCount: 5,
      minScore: 75.0,
      workflowRunId: 'run-fashion-888',
      workflowStatus: 'USER_TASK',
      currentStep: 'WAITING_APPROVAL',
      currentStepTitle: 'Chờ phê duyệt KOC',
      currentRound: 1,
      maxRounds: 1,
      stepDetail: 'Đã thu thập đủ 5 ứng viên đạt chuẩn, chờ phê duyệt',
      approvedKocCount: 5,
      createdAt: '2026-09-08T09:00:00Z',
    },
  ];

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
  });

  test('should display two-line status badge with step title and toggle progress popover', async ({ page }) => {
    await page.goto('/koc/campaigns?dangerously-skip-permissions=true');

    // 1. Verify campaign row visible
    await expect(page.getByText('Chiến dịch FMCG Tết 2026')).toBeVisible({ timeout: 30000 });

    // 2. Verify main RUNNING badge and sub-line step title with round
    await expect(page.getByText('RUNNING', { exact: true })).toBeVisible();
    await expect(page.getByText('Quét tìm KOC')).toBeVisible();
    await expect(page.getByText('(2/3)')).toBeVisible();

    // 3. Verify second campaign with USER_TASK badge and WAITING_APPROVAL step
    await expect(page.getByText('Chiến dịch Thời trang Thu Đông')).toBeVisible();
    await expect(page.getByText('USER_TASK', { exact: true })).toBeVisible();
    await expect(page.getByText('Chờ phê duyệt KOC')).toBeVisible();

    // 4. Click info icon of the first campaign to toggle popover
    const infoButtons = page.getByRole('button', { name: /Chi tiết tiến trình AI|AI Progress Details/i });
    await expect(infoButtons.first()).toBeVisible();
    await infoButtons.first().click();

    // 5. Verify popover content rendered
    const popover = page.locator('.shadow-lg');
    await expect(popover).toBeVisible();
    await expect(popover.getByText('Đang quét bài đăng Facebook theo từ khóa FMCG')).toBeVisible();
    await expect(popover.getByText('4 / 10 KOC')).toBeVisible();
  });
});
