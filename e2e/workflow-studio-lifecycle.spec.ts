import { expect, Page, Route, test } from '@playwright/test';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

interface WorkflowNodeDto {
  id: string;
  type: string;
  [key: string]: JsonValue;
}

interface WorkflowUpsertDto {
  name: string;
  description: string | null;
  definition: {
    nodes: WorkflowNodeDto[];
    edges: Array<{ source: string; target: string }>;
  };
  runtime: { maxParallel: number | null } | null;
  editor?: {
    viewport?: { x: number; y: number; zoom: number };
    nodes?: Record<string, { x: number; y: number }>;
  } | null;
}

interface WorkflowDetailDto {
  definition: {
    id: string;
    name: string;
    description: string | null;
    status: 'DRAFT' | 'ACTIVE';
    currentDraftVersionId: string | null;
    currentPublishedVersionId: string | null;
  };
  versions: Array<{
    id: string;
    workflowDefinitionId: string;
    version: number;
    status: 'DRAFT' | 'PUBLISHED';
    definition: WorkflowUpsertDto['definition'];
    runtime: WorkflowUpsertDto['runtime'];
    compiledPlan: null;
    editor?: WorkflowUpsertDto['editor'];
  }>;
}

interface WorkflowRunDto {
  id: string;
  workflowDefinitionId: string;
  workflowVersionId: string;
  status: 'ERROR' | 'COMPLETED';
  input: JsonValue;
  startedAt: string;
  completedAt: string;
  finalOutcome: 'PASS' | 'FAIL';
  finalOutput: JsonValue;
  nodes: Array<{
    nodeId: string;
    nodeType: string;
    executionStatus: 'ERROR' | 'COMPLETED';
    outcome: 'PASS' | 'FAIL';
    attempt: number;
    inputSnapshot: JsonValue;
    output: JsonValue;
    evidence: JsonValue;
    reason: string | null;
    errorCode: string | null;
    errorMessage: string | null;
  }>;
}

interface WorkflowApiState {
  validateCalls: number;
  createCalls: number;
  updateCalls: number;
  publishCalls: number;
  startCalls: number;
  retryCalls: number;
  lastSavedPayload: WorkflowUpsertDto | null;
  savedDetail: WorkflowDetailDto | null;
  publishedDetail: WorkflowDetailDto | null;
}

const WORKFLOW_ID = 'wf-e2e';
const DRAFT_VERSION_ID = 'draft-e2e';
const PUBLISHED_VERSION_ID = 'published-e2e';
const RUN_ID = 'run-e2e';
const RETRY_RUN_ID = 'run-e2e-retry';

test.describe('Workflow Studio lifecycle', () => {
  test('creates, saves, publishes, runs, inspects and retries a workflow', async ({ page }) => {
    const api = createApiState();
    await page.addInitScript(() => {
      window.localStorage.setItem('dangerously-skip-permissions', 'true');
    });
    await mockWorkflowApi(page, api);

    await page.goto('/ai-agent-mcrs/workflows?dangerously-skip-permissions');
    await expect(page.locator('app-workflow-list-page')).toBeVisible();

    await page.locator('[data-testid="action-toolbar-create"] button').click();
    await page.waitForURL('**/ai-agent-mcrs/workflows/create');
    await expect(page.locator('app-workflow-builder-page')).toBeVisible();

    await page.locator('.flow-palette__item').filter({ hasText: 'AI Gate' }).dblclick();
    await expect(page.locator('[data-node-type="AI_GATE"]')).toBeVisible();

    const aiNodeId = await configureLinearAiWorkflow(page);
    await expect(page.locator('[data-node-id="' + aiNodeId + '"]')).toBeVisible();

    await page.locator('[data-testid="action-toolbar-validate"] button').click();
    await expect(page.getByText(/Workflow (is valid|hop le)/)).toBeVisible();

    await page.locator('[data-testid="action-toolbar-save"] button').click();
    await page.waitForURL('**/ai-agent-mcrs/workflows/wf-e2e/edit');
    expect(api.createCalls).toBe(1);

    await page.locator('[data-testid="action-toolbar-publish"] button').click();
    await expect(page.getByText(/Workflow published|Da publish workflow/)).toBeVisible();

    await page.locator('[data-testid="action-toolbar-run"] button').click();
    await page.locator('.app-drawer .cm-content').click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('{"ticketId":"T-123"}');
    await page.locator('.app-drawer app-button').filter({ hasText: 'Run' }).locator('button').click();

    await page.waitForURL('**/ai-agent-mcrs/workflow-runs/run-e2e');
    await expect(page.locator('app-workflow-run-detail-page')).toContainText('ERROR');
    await page.locator('[data-node-id="' + aiNodeId + '"]').click();
    await expect(page.locator('.workflow-run-detail__inspector')).toContainText(aiNodeId);

    await page.locator('[data-testid="action-toolbar-retry"] button').click();
    await page.waitForURL('**/ai-agent-mcrs/workflow-runs/run-e2e-retry');
    await expect(page.locator('app-workflow-run-detail-page')).toContainText('COMPLETED');

    expect(api.validateCalls).toBeGreaterThanOrEqual(3);
    expect(api.createCalls).toBe(1);
    expect(api.updateCalls).toBe(1);
    expect(api.publishCalls).toBe(1);
    expect(api.startCalls).toBe(1);
    expect(api.retryCalls).toBe(1);
    expect(api.lastSavedPayload?.definition.nodes.some((node) => node.id === aiNodeId && node.type === 'AI_GATE')).toBe(true);
    expect(api.lastSavedPayload?.definition.edges).toEqual([
      { source: 'start-1', target: aiNodeId },
      { source: aiNodeId, target: 'end-1' },
    ]);
  });
});

async function configureLinearAiWorkflow(page: Page): Promise<string> {
  return page.evaluate(() => {
    interface WorkflowNode {
      id: string;
      type: string;
    }
    interface WorkflowStore {
      nodes(): WorkflowNode[];
      updateNodePatch(nodeId: string, patch: Record<string, unknown>): void;
      disconnect(edgeId: string): void;
      connect(edge: { source: string; target: string }): void;
    }
    interface WorkflowBuilderPage {
      store: WorkflowStore;
    }
    const ngWindow = window as Window & {
      ng?: {
        getComponent(element: Element | null): WorkflowBuilderPage | undefined;
        applyChanges?(element: Element | null): void;
      };
    };
    const pageElement = document.querySelector('app-workflow-builder-page');
    const component = ngWindow.ng?.getComponent(pageElement);
    if (!component) {
      throw new Error('Workflow builder page component is not available');
    }
    const aiNode = component.store.nodes().find((node) => node.type === 'AI_GATE');
    if (!aiNode) {
      throw new Error('AI gate node was not added');
    }

    component.store.updateNodePatch(aiNode.id, {
      instruction: 'Assess whether the ticket is ready for automation',
      provider: 'openai',
      modelProfile: 'gpt-5.2',
      toolProfile: 'support-tools',
      outputSchema: '{"type":"object","properties":{"decision":{"type":"string"}}}',
    });
    component.store.disconnect('start-1__end-1');
    component.store.connect({ source: 'start-1', target: aiNode.id });
    component.store.connect({ source: aiNode.id, target: 'end-1' });
    ngWindow.ng?.applyChanges?.(pageElement);
    return aiNode.id;
  });
}

async function mockWorkflowApi(page: Page, state: WorkflowApiState): Promise<void> {
  await page.route('**/ai-agent-mcrs/v1/admin/workflows**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();

    if (method === 'OPTIONS') {
      await fulfillJson(route, null, 204);
      return;
    }

    if (method === 'GET' && path.endsWith('/workflows/page')) {
      await fulfillJson(route, {
        data: [],
        metadata: { pageNumber: 0, pageSize: 20, totalElements: 0, totalPages: 0 },
      });
      return;
    }

    if (method === 'POST' && path.endsWith('/workflows/validate')) {
      state.validateCalls += 1;
      await fulfillJson(route, { valid: true, issues: [] });
      return;
    }

    if (method === 'POST' && path.endsWith('/workflows')) {
      state.createCalls += 1;
      state.lastSavedPayload = request.postDataJSON() as WorkflowUpsertDto;
      state.savedDetail = workflowDetailFromPayload(state.lastSavedPayload, 'DRAFT');
      await fulfillJson(route, state.savedDetail);
      return;
    }

    if (method === 'PUT' && path.endsWith(`/workflows/${WORKFLOW_ID}`)) {
      state.updateCalls += 1;
      state.lastSavedPayload = request.postDataJSON() as WorkflowUpsertDto;
      state.savedDetail = workflowDetailFromPayload(state.lastSavedPayload, 'DRAFT');
      await fulfillJson(route, state.savedDetail);
      return;
    }

    if (method === 'POST' && path.endsWith(`/workflows/${WORKFLOW_ID}/publish`)) {
      state.publishCalls += 1;
      state.publishedDetail = workflowDetailFromPayload(requiredPayload(state), 'ACTIVE');
      await fulfillJson(route, state.publishedDetail);
      return;
    }

    if (method === 'POST' && path.endsWith(`/workflows/${WORKFLOW_ID}/start`)) {
      state.startCalls += 1;
      await fulfillJson(route, workflowRunFromPayload(requiredPayload(state), RUN_ID, 'ERROR'));
      return;
    }

    if (method === 'GET' && path.endsWith(`/workflows/runs/${RUN_ID}`)) {
      await fulfillJson(route, workflowRunFromPayload(requiredPayload(state), RUN_ID, 'ERROR'));
      return;
    }

    if (method === 'POST' && path.endsWith(`/workflows/runs/${RUN_ID}/retry`)) {
      state.retryCalls += 1;
      await fulfillJson(route, workflowRunFromPayload(requiredPayload(state), RETRY_RUN_ID, 'COMPLETED'));
      return;
    }

    if (method === 'GET' && path.endsWith(`/workflows/${WORKFLOW_ID}`)) {
      await fulfillJson(route, state.publishedDetail ?? state.savedDetail ?? workflowDetailFromPayload(requiredPayload(state), 'DRAFT'));
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${method} ${path}` }, 404);
  });
}

function createApiState(): WorkflowApiState {
  return {
    validateCalls: 0,
    createCalls: 0,
    updateCalls: 0,
    publishCalls: 0,
    startCalls: 0,
    retryCalls: 0,
    lastSavedPayload: null,
    savedDetail: null,
    publishedDetail: null,
  };
}

function workflowDetailFromPayload(payload: WorkflowUpsertDto, status: 'DRAFT' | 'ACTIVE'): WorkflowDetailDto {
  const isPublished = status === 'ACTIVE';
  const versionId = isPublished ? PUBLISHED_VERSION_ID : DRAFT_VERSION_ID;
  return {
    definition: {
      id: WORKFLOW_ID,
      name: payload.name || 'Workflow Studio E2E',
      description: payload.description,
      status,
      currentDraftVersionId: isPublished ? DRAFT_VERSION_ID : versionId,
      currentPublishedVersionId: isPublished ? versionId : null,
    },
    versions: [
      {
        id: versionId,
        workflowDefinitionId: WORKFLOW_ID,
        version: 1,
        status: isPublished ? 'PUBLISHED' : 'DRAFT',
        definition: cloneJson(payload.definition),
        runtime: cloneJson(payload.runtime),
        compiledPlan: null,
        editor: cloneJson(payload.editor ?? {
          viewport: { x: 0, y: 0, zoom: 1 },
          nodes: {},
        }),
      },
    ],
  };
}

function workflowRunFromPayload(
  payload: WorkflowUpsertDto,
  runId: string,
  status: WorkflowRunDto['status'],
): WorkflowRunDto {
  const aiNode = payload.definition.nodes.find((node) => node.type === 'AI_GATE');
  const aiNodeId = aiNode?.id ?? 'AI_GATE-missing';
  const failed = status === 'ERROR';
  return {
    id: runId,
    workflowDefinitionId: WORKFLOW_ID,
    workflowVersionId: PUBLISHED_VERSION_ID,
    status,
    input: { ticketId: 'T-123' },
    startedAt: '2026-08-22T18:00:00.000Z',
    completedAt: '2026-08-22T18:00:05.000Z',
    finalOutcome: failed ? 'FAIL' : 'PASS',
    finalOutput: { decision: failed ? 'needs-review' : 'approved' },
    nodes: [
      runtimeNode('start-1', 'START', 'COMPLETED'),
      runtimeNode(aiNodeId, 'AI_GATE', status),
      runtimeNode('end-1', 'END', failed ? 'ERROR' : 'COMPLETED'),
    ],
  };
}

function runtimeNode(
  nodeId: string,
  nodeType: string,
  status: WorkflowRunDto['nodes'][number]['executionStatus'],
): WorkflowRunDto['nodes'][number] {
  const failed = status === 'ERROR';
  return {
    nodeId,
    nodeType,
    executionStatus: status,
    outcome: failed ? 'FAIL' : 'PASS',
    attempt: failed ? 2 : 1,
    inputSnapshot: { ticketId: 'T-123' },
    output: { status },
    evidence: { source: 'playwright' },
    reason: failed ? 'Model timeout in E2E fixture' : null,
    errorCode: failed ? 'MODEL_TIMEOUT' : null,
    errorMessage: failed ? 'Fixture failure before retry' : null,
  };
}

function requiredPayload(state: WorkflowApiState): WorkflowUpsertDto {
  if (!state.lastSavedPayload) {
    throw new Error('Workflow payload was not saved before this API call');
  }
  return state.lastSavedPayload;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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
    body: status === 204 ? '' : JSON.stringify({ data }),
  });
}
