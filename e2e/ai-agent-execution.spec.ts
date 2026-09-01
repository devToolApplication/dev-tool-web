import { expect, type Page, type Route, test } from '@playwright/test';

interface SdkTaskRunRequest {
  agentCode: string;
  provider?: 'codex' | 'claude';
  prompt: string;
  threadId?: string;
  workingDirectory?: string;
  model?: string;
  reasoningEffort?: string;
  outputSchema?: Record<string, unknown>;
  requestContext?: Record<string, unknown>;
  callbackUrl?: string;
  callbackAuthSecretCode?: string;
}

interface SdkTaskRunSummary {
  taskId: string;
  status: 'RUNNING' | 'COMPLETED';
  agentCode: string;
  provider: 'codex' | 'claude';
  workingDirectory?: string;
  threadId?: string;
  model?: string;
  reasoningEffort?: string;
  promptPreview: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface SdkTaskApiState {
  postCalls: number;
  lastPayload: SdkTaskRunRequest | null;
  runs: SdkTaskRunSummary[];
}

const PAGE_URL = '/admin/system-management/ai-agent-execution?dangerously-skip-permissions';
const EXISTING_RUN: SdkTaskRunSummary = {
  taskId: 'task-existing-1',
  status: 'COMPLETED',
  agentCode: 'test-qa-agent',
  provider: 'codex',
  workingDirectory: 'D:/Code/web/dev-tool-web',
  threadId: 'thread-existing',
  model: 'gpt-5.2',
  reasoningEffort: 'medium',
  promptPreview: 'Review existing task history',
  createdAt: '2026-09-01T02:00:00Z',
  updatedAt: '2026-09-01T02:01:00Z',
  completedAt: '2026-09-01T02:01:00Z',
};

test.describe('AI Agent Execution SDK console', () => {
  test('runs a full SDK prompt request and inspects server history detail', async ({ page }) => {
    const state: SdkTaskApiState = {
      postCalls: 0,
      lastPayload: null,
      runs: [EXISTING_RUN],
    };

    await page.addInitScript(() => {
      window.localStorage.setItem('dangerously-skip-permissions', 'true');
    });
    await mockSdkTaskApi(page, state);

    await page.goto(PAGE_URL);

    await expect(page.locator('app-sdk-task-console')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'SDK task console' })).toBeVisible();
    await expect(page.getByRole('button', { name: /task-existing-1|task-existing/i })).toBeVisible();

    await page.locator('#sdk-task-agent').fill('dev-fe-agent');
    await page.locator('#sdk-task-prompt').fill('Run a UI audit for the SDK console');
    await page.locator('#sdk-task-thread').fill('thread-e2e');
    await page.locator('#sdk-task-working-directory').fill('D:/Code/web/dev-tool-web');
    await page.locator('#sdk-task-model').fill('gpt-5.2');
    await page.locator('#sdk-task-reasoning').fill('medium');
    await fillCodeMirror(page, 'Output schema', '{"type":"object"}');
    await fillCodeMirror(page, 'Request context', '{"source":"playwright"}');
    await page.locator('#sdk-task-callback-url').fill('https://callback.internal/sdk');
    await page.locator('#sdk-task-callback-secret').fill('secret-e2e');

    await page.getByRole('button', { name: 'Run' }).click();

    await expect.poll(() => state.postCalls).toBe(1);
    expect(state.lastPayload).toMatchObject({
      agentCode: 'dev-fe-agent',
      provider: 'codex',
      prompt: 'Run a UI audit for the SDK console',
      threadId: 'thread-e2e',
      workingDirectory: 'D:/Code/web/dev-tool-web',
      model: 'gpt-5.2',
      reasoningEffort: 'medium',
      outputSchema: { type: 'object' },
      requestContext: { source: 'playwright' },
      callbackUrl: 'https://callback.internal/sdk',
      callbackAuthSecretCode: 'secret-e2e',
    });

    await expect(page.getByRole('button', { name: /task-e2e-1/i })).toBeVisible();
    await expect(page.locator('.sdk-task-console__detail-head')).toContainText('task-e2e-1');
    await page.getByRole('tab', { name: 'Request' }).click();
    await expect(page.locator('app-json-viewer')).toContainText('callbackAuthSecretConfigured');
  });
});

async function fillCodeMirror(page: Page, label: string, value: string): Promise<void> {
  const host = page.locator('app-input-area').filter({ hasText: label }).first();
  const editor = host.locator('.cm-content');
  if (await editor.isVisible()) {
    await editor.click();
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await page.keyboard.insertText(value);
    return;
  }

  await host.evaluate((element, text) => {
    const ngWindow = window as Window & {
      ng?: {
        getComponent(element: Element | null): { onChange(value: string): void } | undefined;
        applyChanges?(element: Element | null): void;
      };
    };
    const component = ngWindow.ng?.getComponent(element);
    if (!component) {
      throw new Error('Input area component is not available');
    }
    component.onChange(text);
    ngWindow.ng?.applyChanges?.(element);
  }, value);
}

async function mockSdkTaskApi(page: Page, state: SdkTaskApiState): Promise<void> {
  await page.route('**/ai-agent-mcrs/v1/admin/sdk/tasks/runs**', async (route) => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname;

    if (method === 'GET' && path.endsWith('/sdk/tasks/runs')) {
      await fulfillJson(route, {
        items: state.runs,
        page: 1,
        size: 20,
        total: state.runs.length,
      });
      return;
    }

    if (method === 'POST' && path.endsWith('/sdk/tasks/runs')) {
      state.postCalls += 1;
      state.lastPayload = request.postDataJSON() as SdkTaskRunRequest;
      const created: SdkTaskRunSummary = {
        taskId: 'task-e2e-1',
        status: 'RUNNING',
        agentCode: state.lastPayload.agentCode,
        provider: state.lastPayload.provider ?? 'codex',
        workingDirectory: state.lastPayload.workingDirectory,
        threadId: state.lastPayload.threadId,
        model: state.lastPayload.model,
        reasoningEffort: state.lastPayload.reasoningEffort,
        promptPreview: state.lastPayload.prompt,
        createdAt: '2026-09-01T02:47:24Z',
        updatedAt: '2026-09-01T02:47:24Z',
      };
      state.runs = [created, ...state.runs];
      await fulfillJson(route, created, 202);
      return;
    }

    const match = path.match(/\/sdk\/tasks\/runs\/([^/]+)$/);
    if (method === 'GET' && match) {
      const taskId = decodeURIComponent(match[1]);
      const run = state.runs.find((item) => item.taskId === taskId) ?? EXISTING_RUN;
      await fulfillJson(route, {
        ...run,
        request: {
          agentCode: run.agentCode,
          provider: run.provider,
          prompt: run.promptPreview,
          threadId: run.threadId,
          workingDirectory: run.workingDirectory,
          model: run.model,
          reasoningEffort: run.reasoningEffort,
          outputSchema: state.lastPayload?.outputSchema,
          requestContext: state.lastPayload?.requestContext,
          callbackUrl: state.lastPayload?.callbackUrl,
          callbackAuthSecretConfigured: Boolean(state.lastPayload?.callbackAuthSecretCode),
        },
        events: [
          { sequence: 1, at: run.createdAt, type: 'accepted' },
          { sequence: 2, at: run.updatedAt, type: 'stdout', data: 'started' },
        ],
        result: {
          status: run.status === 'RUNNING' ? 'COMPLETED' : run.status,
          agentCode: run.agentCode,
          provider: run.provider,
          preflight: { status: 'READY' },
        },
      });
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${method} ${path}` }, 404);
  });
}

async function fulfillJson(route: Route, data: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ data }),
  });
}
