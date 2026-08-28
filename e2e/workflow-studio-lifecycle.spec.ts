import { expect, Page, Route, test } from '@playwright/test';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

interface WorkflowUpsertDto {
  name: string;
  description: string | null;
  bpmnXml: string;
  runtime: { maxParallel: number | null } | null;
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
    bpmnXml: string;
    runtime: WorkflowUpsertDto['runtime'];
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

const SAMPLE_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" targetNamespace="http://devtool.vn/workflow">
  <process id="wf_e2e_process" name="Workflow Studio E2E" isExecutable="true">
    <startEvent id="start-event-1" name="Start" />
    <serviceTask id="task-ai-eval" name="AI Assessment" />
    <endEvent id="end-event-1" name="End" />
    <sequenceFlow id="flow-1" sourceRef="start-event-1" targetRef="task-ai-eval" />
    <sequenceFlow id="flow-2" sourceRef="task-ai-eval" targetRef="end-event-1" />
  </process>
  <bpmndi:BPMNDiagram id="wf_e2e_diagram">
    <bpmndi:BPMNPlane id="wf_e2e_plane" bpmnElement="wf_e2e_process">
      <bpmndi:BPMNShape id="start_shape" bpmnElement="start-event-1"><dc:Bounds x="150" y="150" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="task_shape" bpmnElement="task-ai-eval"><dc:Bounds x="250" y="130" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="end_shape" bpmnElement="end-event-1"><dc:Bounds x="420" y="150" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="flow1_edge" bpmnElement="flow-1"><di:waypoint x="186" y="168" /><di:waypoint x="250" y="170" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="flow2_edge" bpmnElement="flow-2"><di:waypoint x="350" y="170" /><di:waypoint x="420" y="168" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;

test.describe('Workflow Studio lifecycle', () => {
  test('creates, saves, publishes, runs, inspects and retries a Flowable BPMN workflow', async ({ page }) => {
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
    await expect(page.locator('.workflow-bpmn-canvas')).toBeVisible();

    await configureBpmnWorkflow(page, SAMPLE_BPMN_XML, 'Workflow Studio E2E');

    await page.locator('[data-testid="action-toolbar-validate"] button').click();
    await expect(page.getByText(/Workflow (is valid|hop le)/)).toBeVisible();

    await page.locator('[data-testid="action-toolbar-save"] button').click();
    await page.waitForURL('**/ai-agent-mcrs/workflows/wf-e2e/edit');
    expect(api.createCalls).toBe(1);

    await page.locator('[data-testid="action-toolbar-publish"] button').click();
    await expect.poll(() => api.publishCalls).toBe(1);

    await page.locator('[data-testid="action-toolbar-run"] button').click();
    await page.locator('.app-drawer app-button').filter({ hasText: 'Run' }).locator('button').click();

    await page.waitForURL('**/ai-agent-mcrs/workflow-runs/run-e2e');
    await expect(page.locator('app-workflow-run-detail-page')).toContainText('ERROR');

    await page.locator('[data-testid="action-toolbar-retry"] button').click();
    await page.waitForURL('**/ai-agent-mcrs/workflow-runs/run-e2e-retry');
    await expect(page.locator('app-workflow-run-detail-page')).toContainText('COMPLETED');

    expect(api.validateCalls).toBeGreaterThanOrEqual(1);
    expect(api.createCalls).toBe(1);
    expect(api.publishCalls).toBe(1);
    expect(api.startCalls).toBe(1);
    expect(api.retryCalls).toBe(1);
    expect(api.lastSavedPayload?.bpmnXml).toContain('task-ai-eval');
  });
});

async function configureBpmnWorkflow(page: Page, xml: string, name: string): Promise<void> {
  await page.evaluate(({ xml, name }) => {
    interface WorkflowStore {
      updateBpmnXml(xml: string): void;
      updateWorkflowMetadata(name: string, description: string | null): void;
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
    component.store.updateBpmnXml(xml);
    component.store.updateWorkflowMetadata(name, 'Automated E2E Test Workflow');
    ngWindow.ng?.applyChanges?.(pageElement);
  }, { xml, name });
}

async function mockWorkflowApi(page: Page, state: WorkflowApiState): Promise<void> {
  await page.route('**/ai-agent-mcrs/v1/admin/workflows**', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname;

    if (method === 'GET' && path.endsWith('/workflows/page')) {
      await fulfillJson(route, {
        data: state.publishedDetail ? [state.publishedDetail.definition] : [],
        metadata: {
          pageNumber: 0,
          pageSize: 20,
          totalElements: state.publishedDetail ? 1 : 0,
          totalPages: state.publishedDetail ? 1 : 0,
        },
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
        bpmnXml: payload.bpmnXml,
        runtime: cloneJson(payload.runtime),
      },
    ],
  };
}

function workflowRunFromPayload(
  payload: WorkflowUpsertDto,
  runId: string,
  status: WorkflowRunDto['status'],
): WorkflowRunDto {
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
      runtimeNode('start-event-1', 'START_EVENT', 'COMPLETED'),
      runtimeNode('task-ai-eval', 'SERVICE_TASK', status),
      runtimeNode('end-event-1', 'END_EVENT', failed ? 'ERROR' : 'COMPLETED'),
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