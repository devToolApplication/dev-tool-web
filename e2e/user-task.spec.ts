import { expect, Page, Route, test } from '@playwright/test';

type TaskActionRequest = {
  requestId: string;
  action: string;
  variables?: Record<string, unknown>;
  comment?: string;
};

type CapturedAction = {
  taskId: string;
  body: TaskActionRequest;
};

type MockApiState = {
  actions: CapturedAction[];
  listQueries: URLSearchParams[];
};

const taskSummaries = [
  taskSummary('task-koc-approval', 'Approve KOC candidates', 'KOC_CANDIDATE_APPROVAL', [
    'APPROVE',
    'REJECT',
  ]),
  taskSummary('task-discovery', 'Decide whether to find more KOCs', 'KOC_DISCOVERY_DECISION', [
    'FIND_MORE',
    'STOP',
  ]),
  taskSummary('task-2fa', 'Confirm platform 2FA', 'MANUAL_2FA_CONFIRMATION', ['CONFIRM']),
  taskSummary('task-approval', 'Approve budget request', 'APPROVAL', [
    'APPROVE',
    'REJECT',
    'RETURN',
  ]),
  taskSummary('task-unknown', 'Future workflow task', 'FUTURE_SCREEN', []),
];

const taskDetails: Record<string, Record<string, unknown>> = {
  'task-koc-approval': detail(taskSummaries[0], {
    campaignId: 'campaign-42',
    campaignName: 'Launch Campaign',
    niche: 'TECH',
    targetCount: 2,
    minScore: 70,
    candidates: [
      {
        externalProfileId: 'candidate-qualified',
        fullName: 'Candidate Alpha',
        profileUrl: 'https://example.com/candidate-alpha',
        platform: 'FACEBOOK',
        followerCount: 120000,
        engagementRate: 6.5,
        score: 91,
        strengths: ['Strong reach'],
        risks: [],
        reviewNote: 'Consistent content quality',
      },
      {
        externalProfileId: 'candidate-below-threshold',
        fullName: 'Candidate Beta',
        profileUrl: 'https://example.com/candidate-beta',
        platform: 'TIKTOK',
        followerCount: 54000,
        engagementRate: 3.2,
        score: 65,
        strengths: [],
        risks: ['Below score threshold'],
      },
    ],
  }),
  'task-discovery': detail(taskSummaries[1], {
    campaignId: 'campaign-42',
    campaignName: 'Launch Campaign',
    niche: 'TECH',
    currentRound: 2,
    roundLimit: 3,
    qualifiedCount: 4,
    targetCount: 8,
    candidatePreview: [
      {
        externalProfileId: 'candidate-preview',
        fullName: 'Discovery Preview',
        profileUrl: 'https://example.com/discovery-preview',
        platform: 'FACEBOOK',
        followerCount: 43000,
        score: 78,
      },
    ],
  }),
  'task-2fa': detail(taskSummaries[2], {
    platform: 'FACEBOOK',
    actionRequired: 'Approve the login notification on the trusted device',
    verificationNumber: '7284',
    message: 'Confirm only when the number matches.',
  }),
  'task-approval': detail(taskSummaries[3], {
    title: 'Budget approval',
    summary: 'Approve the campaign production budget.',
    reference: 'BUDGET-2026-42',
    requester: 'Marketing Operations',
    submittedAt: '2026-09-09T03:00:00Z',
    fields: [
      { key: 'amount', label: 'Amount', value: 'USD 25,000' },
      { key: 'costCenter', label: 'Cost center', value: 'MKT-100' },
    ],
  }),
  'task-unknown': {
    task: taskSummaries[4],
    supported: false,
    content: {
      secret: 'RAW_PROCESS_SECRET_MUST_NOT_RENDER',
      token: 'RAW_PROCESS_TOKEN_MUST_NOT_RENDER',
    },
    allowedActions: [],
    permission: permission(false, true),
  },
  'task-completed': detail(
    {
      ...taskSummary('task-completed', 'Completed approval', 'APPROVAL', []),
      completed: true,
      readOnly: true,
      canAct: false,
    },
    {
      title: 'Completed budget approval',
      summary: 'This request is already complete.',
      reference: 'DONE-42',
      requester: 'Finance',
      submittedAt: '2026-09-08T03:00:00Z',
      fields: [{ key: 'result', label: 'Result', value: 'Approved' }],
    },
    false,
    true,
  ),
};

test.describe('User-task framework', () => {
  let api: MockApiState;

  test.beforeEach(async ({ page }) => {
    api = { actions: [], listQueries: [] };
    await page.addInitScript(() => {
      window.localStorage.setItem('dangerously-skip-permissions', 'true');
      window.localStorage.setItem('app-language', 'en');
    });
    await mockUserTaskApi(page, api);
  });

  test('renders inbox and opens a task with keyboard-only navigation', async ({ page }) => {
    await page.goto('/tasks?dangerously-skip-permissions=true');

    await expect(page.locator('app-task-inbox')).toBeVisible();
    await expect(page.getByText('Approve KOC candidates')).toBeVisible();
    await expect(page.getByText('Future workflow task')).toBeVisible();

    const row = page
      .locator('app-task-inbox app-table tbody tr')
      .filter({ hasText: 'Approve KOC candidates' });
    await row.focus();
    await row.press('Enter');

    await expect(page).toHaveURL(/\/tasks\/task-koc-approval$/);
    await expect(page.locator('app-task-shell h1')).toHaveText('Approve KOC candidates');
  });

  test('approves only qualified KOC candidates with a minimal payload', async ({ page }) => {
    await openTask(page, 'task-koc-approval', 'Approve KOC candidates');

    await expect(page.getByRole('checkbox', { name: 'Candidate Alpha' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Candidate Beta' })).not.toBeChecked();

    await submitAction(page, 'Approve');

    expect(api.actions).toHaveLength(1);
    expect(api.actions[0].taskId).toBe('task-koc-approval');
    expect(api.actions[0].body.action).toBe('APPROVE');
    expect(api.actions[0].body.variables).toEqual({
      approvedCandidateIds: ['candidate-qualified'],
    });
    expect(Object.keys(api.actions[0].body.variables ?? {})).toEqual(['approvedCandidateIds']);
    expect(api.actions[0].body.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  test('submits FIND_MORE without client-derived workflow variables', async ({ page }) => {
    await openTask(page, 'task-discovery', 'Decide whether to find more KOCs');

    await expect(page.getByText('Discovery Preview')).toBeVisible();
    await submitAction(page, 'Find More');

    expect(api.actions[0]).toMatchObject({
      taskId: 'task-discovery',
      body: { action: 'FIND_MORE', variables: {} },
    });
  });

  test('confirms manual 2FA without sending secrets or approval flags', async ({ page }) => {
    await openTask(page, 'task-2fa', 'Confirm platform 2FA');

    await expect(page.getByText('7284', { exact: true })).toBeVisible();
    await expect(page.getByText('Confirm only when the number matches.')).toBeVisible();
    await submitAction(page, 'Confirm 2FA');

    expect(api.actions[0]).toMatchObject({
      taskId: 'task-2fa',
      body: { action: 'CONFIRM', variables: {} },
    });
  });

  test('requires and submits a comment for generic RETURN', async ({ page }) => {
    await openTask(page, 'task-approval', 'Approve budget request');

    await expect(page.getByText('USD 25,000')).toBeVisible();
    await page.getByRole('button', { name: 'Request Revision', exact: true }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(page.getByText('Please provide a reason for this action').first()).toBeVisible();

    await page.locator('app-task-action-bar textarea').fill('Please attach the vendor quote.');
    await submitAction(page, 'Request Revision');

    expect(api.actions[0]).toMatchObject({
      taskId: 'task-approval',
      body: {
        action: 'RETURN',
        variables: {},
        comment: 'Please attach the vendor quote.',
      },
    });
  });

  test('keeps completed task deep links read-only', async ({ page }) => {
    await openTask(page, 'task-completed', 'Completed approval', 'Task completed');

    await expect(
      page.getByText('This task is read-only. No further actions can be submitted.'),
    ).toBeVisible();
    await expect(page.getByText('Completed budget approval')).toBeVisible();
    await expect(page.locator('app-task-action-bar')).toHaveCount(0);
  });

  test('redacts unknown formKey content and exposes no action', async ({ page }) => {
    await page.goto('/tasks/task-unknown?dangerously-skip-permissions=true');

    await expect(page.getByText('Unsupported Screen Type').first()).toBeVisible();
    await expect(page.getByText('FUTURE_SCREEN').first()).toBeVisible();
    await expect(page.getByText('RAW_PROCESS_SECRET_MUST_NOT_RENDER')).toHaveCount(0);
    await expect(page.getByText('RAW_PROCESS_TOKEN_MUST_NOT_RENDER')).toHaveCount(0);
    await expect(page.locator('app-task-action-bar')).toHaveCount(0);
  });

  test('restores action focus after Escape and does not overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await openTask(page, 'task-koc-approval', 'Approve KOC candidates');

    await expect(page.locator('#task-shell-live-region')).toContainText('Task is ready');
    await expect(page.locator('section[aria-label="Task content"]')).toBeVisible();
    await expect(
      page.locator('aside[aria-label="Task information and history"]'),
    ).toBeVisible();

    const approve = page.getByRole('button', { name: 'Approve', exact: true });
    await approve.focus();
    await approve.press('Enter');
    const dialog = page.getByRole('alertdialog', { name: 'Confirm Action' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await dialog.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(approve).toBeFocused();
    expect(api.actions).toHaveLength(0);

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });

  test('redirects legacy KOC approval links without calling legacy task APIs', async ({ page }) => {
    await page.goto(
      '/koc/approval?campaignId=campaign-42&dangerously-skip-permissions=true',
    );

    await expect(page).toHaveURL(/\/tasks\?.*businessKey=campaign-42/);
    await expect
      .poll(() => api.listQueries.some((params) => params.get('businessKey') === 'campaign-42'))
      .toBe(true);

    await page.goto('/koc/approval?taskId=task-approval&dangerously-skip-permissions=true');
    await expect(page).toHaveURL(/\/tasks\/task-approval$/);
    await expect(page.locator('app-task-shell h1')).toHaveText('Approve budget request');
  });
});

function taskSummary(
  taskId: string,
  taskName: string,
  formKey: string,
  allowedActions: string[],
): Record<string, unknown> {
  return {
    taskId,
    processInstanceId: `process-${taskId}`,
    businessKey: 'campaign-42',
    formKey,
    taskName,
    processDefinitionName: 'User Task E2E',
    assignee: 'dev-user',
    createdAt: '2026-09-09T02:00:00Z',
    dueAt: '2026-09-10T02:00:00Z',
    priority: 50,
    completed: false,
    claimable: false,
    readOnly: allowedActions.length === 0,
    canAct: allowedActions.length > 0,
    allowedActions,
  };
}

function permission(canAct: boolean, readOnly = false): Record<string, boolean> {
  return {
    visible: true,
    claimable: false,
    readOnly,
    canAct,
  };
}

function detail(
  task: Record<string, unknown>,
  content: Record<string, unknown>,
  canAct = true,
  readOnly = false,
): Record<string, unknown> {
  return {
    task,
    supported: true,
    content,
    allowedActions: task['allowedActions'],
    permission: permission(canAct, readOnly),
  };
}

async function openTask(
  page: Page,
  taskId: string,
  taskName: string,
  liveText = 'Task is ready',
): Promise<void> {
  await page.goto(`/tasks/${taskId}?dangerously-skip-permissions=true`);
  await expect(page.locator('app-task-shell h1')).toHaveText(taskName);
  await expect(page.locator('#task-shell-live-region')).toContainText(liveText);
}

async function submitAction(page: Page, actionLabel: string): Promise<void> {
  await page.getByRole('button', { name: actionLabel, exact: true }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Confirm Action' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Confirm Action', exact: true }).click();
  await page.waitForURL((url) => url.pathname.endsWith('/tasks'));
}

async function mockUserTaskApi(page: Page, state: MockApiState): Promise<void> {
  const basePath = '/ai-agent-mcrs/v1/user-tasks';

  await page.route('**/ai-agent-mcrs/v1/user-tasks**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (method === 'OPTIONS') {
      await fulfillJson(route, null, 204);
      return;
    }

    if (method === 'GET' && url.pathname === basePath) {
      state.listQueries.push(new URLSearchParams(url.searchParams));
      await fulfillJson(route, {
        data: taskSummaries,
        metadata: {
          totalElements: taskSummaries.length,
          totalPages: 1,
          pageNumber: 0,
          pageSize: 10,
        },
      });
      return;
    }

    const suffix = url.pathname.startsWith(`${basePath}/`)
      ? url.pathname.slice(basePath.length + 1)
      : '';
    const segments = suffix.split('/').filter(Boolean);
    const taskId = decodeURIComponent(segments[0] ?? '');

    if (method === 'GET' && segments.length === 2 && segments[1] === 'history') {
      await fulfillJson(route, []);
      return;
    }

    if (method === 'GET' && segments.length === 1 && taskDetails[taskId]) {
      await fulfillJson(route, taskDetails[taskId]);
      return;
    }

    if (method === 'POST' && segments.length === 2 && segments[1] === 'claim') {
      await fulfillJson(route, taskSummaries.find((task) => task['taskId'] === taskId));
      return;
    }

    if (method === 'POST' && segments.length === 2 && segments[1] === 'actions') {
      const body = request.postDataJSON() as TaskActionRequest;
      state.actions.push({ taskId, body });
      await fulfillJson(route, {
        taskId,
        requestId: body.requestId,
        action: body.action,
        status: 'COMPLETED',
        completedAt: '2026-09-09T04:00:00Z',
        actor: 'dev-user',
      });
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${method} ${url.pathname}` }, 404);
  });
}

async function fulfillJson(route: Route, data: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization',
      'content-type': 'application/json',
    },
    body: status === 204 ? '' : JSON.stringify({ data }),
  });
}
