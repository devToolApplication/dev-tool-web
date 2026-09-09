import { APIRequestContext, expect, Page, test } from '@playwright/test';

const liveEnabled = process.env['RUN_LIVE_USER_TASK_E2E'] === 'true';

test.describe('Generic APPROVAL live user-task flow', () => {
  test.skip(
    !liveEnabled,
    'Set RUN_LIVE_USER_TASK_E2E=true and the documented E2E environment variables.',
  );

  test('creates, completes and reopens a real Flowable approval task', async ({
    page,
    request,
  }) => {
    const appBaseUrl = requiredEnv('E2E_APP_BASE_URL');
    const apiBaseUrl = `${requiredEnv('E2E_API_BASE_URL').replace(/\/$/, '')}/ai-agent-mcrs/v1`;
    const username = requiredEnv('E2E_KEYCLOAK_USERNAME');
    const password = requiredEnv('E2E_KEYCLOAK_PASSWORD');
    const token = await fetchAccessToken(request, username, password);
    const fixtureId = `approval_live_${Date.now()}`;
    const taskName = `Generic Approval Live ${fixtureId}`;

    const workflowId = await createAndPublishFixture(
      request,
      apiBaseUrl,
      token,
      fixtureId,
      taskName,
    );
    await startFixture(request, apiBaseUrl, token, workflowId, username, fixtureId);
    const taskId = await waitForTask(request, apiBaseUrl, token, taskName);

    await loginAndOpenTask(page, appBaseUrl, taskId, username, password);
    await expect(page.getByText(`Reference ${fixtureId}`)).toBeVisible();

    await page.getByRole('button', { name: /Approve|Phê duyệt/i, exact: true }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole('button', { name: /Confirm Action|Xác nhận thực hiện/i })
      .click();
    await page.waitForURL((url) => url.pathname.endsWith('/tasks'));

    await page.goto(`${appBaseUrl}/tasks/${taskId}`);
    await expect(page.locator('#task-shell-live-region')).toContainText(
      /Task completed|Đã hoàn thành tác vụ/i,
    );
    await expect(page.locator('app-task-action-bar')).toHaveCount(0);
    await expect(page.getByText(/APPROVE/).first()).toBeVisible();
  });
});

async function fetchAccessToken(
  request: APIRequestContext,
  username: string,
  password: string,
): Promise<string> {
  const keycloakUrl = requiredEnv('E2E_KEYCLOAK_URL').replace(/\/$/, '');
  const realm = requiredEnv('E2E_KEYCLOAK_REALM');
  const clientId = requiredEnv('E2E_KEYCLOAK_CLIENT_ID');
  const response = await request.post(
    `${keycloakUrl}/realms/${encodeURIComponent(realm)}/protocol/openid-connect/token`,
    {
      form: {
        grant_type: 'password',
        client_id: clientId,
        username,
        password,
      },
    },
  );
  expect(response.ok(), await response.text()).toBe(true);
  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error('Keycloak response did not contain access_token');
  }
  return payload.access_token;
}

async function createAndPublishFixture(
  request: APIRequestContext,
  apiBaseUrl: string,
  token: string,
  fixtureId: string,
  taskName: string,
): Promise<string> {
  const createResponse = await request.post(`${apiBaseUrl}/admin/workflows`, {
    headers: bearer(token),
    data: {
      name: taskName,
      description: 'Playwright generic approval live fixture',
      bpmnXml: genericApprovalBpmn(fixtureId, taskName),
      runtime: { maxParallel: 1 },
    },
  });
  expect(createResponse.ok(), await createResponse.text()).toBe(true);
  const created = (await createResponse.json()) as {
    data?: { definition?: { id?: string } };
  };
  const workflowId = created.data?.definition?.id;
  if (!workflowId) {
    throw new Error('Workflow create response did not contain definition.id');
  }

  const publishResponse = await request.post(
    `${apiBaseUrl}/admin/workflows/${encodeURIComponent(workflowId)}/publish`,
    { headers: bearer(token) },
  );
  expect(publishResponse.ok(), await publishResponse.text()).toBe(true);
  return workflowId;
}

async function startFixture(
  request: APIRequestContext,
  apiBaseUrl: string,
  token: string,
  workflowId: string,
  username: string,
  fixtureId: string,
): Promise<void> {
  const response = await request.post(
    `${apiBaseUrl}/admin/workflows/${encodeURIComponent(workflowId)}/start`,
    {
      headers: bearer(token),
      data: {
        input: {
          assignee: username,
          approvalContext: {
            title: `Live approval ${fixtureId}`,
            summary: 'Deterministic Flowable fixture without external integrations.',
            reference: `Reference ${fixtureId}`,
            requester: username,
            submittedAt: new Date().toISOString(),
            fields: [{ key: 'scope', label: 'Scope', value: 'Generic APPROVAL' }],
          },
        },
      },
    },
  );
  expect(response.ok(), await response.text()).toBe(true);
}

async function waitForTask(
  request: APIRequestContext,
  apiBaseUrl: string,
  token: string,
  taskName: string,
): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await request.get(`${apiBaseUrl}/user-tasks`, {
      headers: bearer(token),
      params: {
        view: 'MY',
        status: 'ACTIVE',
        keyword: taskName,
        page: '0',
        size: '10',
      },
    });
    expect(response.ok(), await response.text()).toBe(true);
    const payload = (await response.json()) as {
      data?: { data?: Array<{ taskId?: string; taskName?: string }> };
    };
    const task = payload.data?.data?.find((item) => item.taskName === taskName);
    if (task?.taskId) return task.taskId;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Live task was not created: ${taskName}`);
}

async function loginAndOpenTask(
  page: Page,
  appBaseUrl: string,
  taskId: string,
  username: string,
  password: string,
): Promise<void> {
  await page.goto(`${appBaseUrl.replace(/\/$/, '')}/tasks/${taskId}`);
  const usernameInput = page.locator('#username');
  if (await usernameInput.count()) {
    await usernameInput.fill(username);
    await page.locator('#password').fill(password);
    await page.locator('#kc-login').click();
  }
  await expect(page).toHaveURL(new RegExp(`/tasks/${escapeRegExp(taskId)}$`));
  await expect(page.locator('app-task-shell h1')).toBeVisible();
}

function bearer(token: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  };
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function genericApprovalBpmn(fixtureId: string, taskName: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:flowable="http://flowable.org/bpmn"
  targetNamespace="http://dev-tool/workflows">
  <process id="${fixtureId}" name="${taskName}" isExecutable="true">
    <startEvent id="start" />
    <sequenceFlow id="start_to_approval" sourceRef="start" targetRef="approval" />
    <userTask id="approval" name="${taskName}" flowable:formKey="APPROVAL" flowable:assignee="\${assignee}" />
    <sequenceFlow id="approval_to_outcome" sourceRef="approval" targetRef="outcome" />
    <exclusiveGateway id="outcome" default="outcome_failed" />
    <sequenceFlow id="outcome_approved" sourceRef="outcome" targetRef="approved">
      <conditionExpression xsi:type="tFormalExpression"><![CDATA[\${taskOutcome == 'APPROVE'}]]></conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="outcome_rejected" sourceRef="outcome" targetRef="rejected">
      <conditionExpression xsi:type="tFormalExpression"><![CDATA[\${taskOutcome == 'REJECT'}]]></conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="outcome_returned" sourceRef="outcome" targetRef="returned">
      <conditionExpression xsi:type="tFormalExpression"><![CDATA[\${taskOutcome == 'RETURN'}]]></conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="outcome_failed" sourceRef="outcome" targetRef="failed" />
    <endEvent id="approved" />
    <endEvent id="rejected" />
    <endEvent id="returned" />
    <endEvent id="failed" />
  </process>
</definitions>`;
}
