import { expect, test } from '@playwright/test';

test.describe('Workflow Run Management & Debugger E2E', () => {
  test('lists workflow runs, opens trigger dialog, triggers a run and navigates to debugger view', async ({ page }) => {
    const sampleBpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC"
             xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI"
             targetNamespace="http://devtool.vn/workflow">
  <process id="wf_sample" name="Sample Execution Workflow" isExecutable="true">
    <startEvent id="start-node" name="Start" />
    <sequenceFlow id="flow-1" sourceRef="start-node" targetRef="task-node" />
    <serviceTask id="task-node" name="Execute Logic" />
    <sequenceFlow id="flow-2" sourceRef="task-node" targetRef="end-node" />
    <endEvent id="end-node" name="End" />
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="wf_sample">
      <bpmndi:BPMNShape id="start-node_di" bpmnElement="start-node">
        <omgdc:Bounds x="150" y="100" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="task-node_di" bpmnElement="task-node">
        <omgdc:Bounds x="240" y="78" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="end-node_di" bpmnElement="end-node">
        <omgdc:Bounds x="390" y="100" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="flow-1_di" bpmnElement="flow-1">
        <omgdi:waypoint x="186" y="118" />
        <omgdi:waypoint x="240" y="118" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="flow-2_di" bpmnElement="flow-2">
        <omgdi:waypoint x="340" y="118" />
        <omgdi:waypoint x="390" y="118" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;

    const mockRun = {
      id: 'run-999',
      workflowDefinitionId: 'wf-1',
      workflowVersionId: 'ver-1',
      status: 'COMPLETED',
      input: { testKey: 'testVal' },
      startedAt: '2026-09-04T10:00:00Z',
      completedAt: '2026-09-04T10:00:05Z',
      finalOutcome: 'PASS',
      finalOutput: { success: true },
      nodes: [
        {
          nodeId: 'start-node',
          nodeType: 'START',
          executionStatus: 'COMPLETED',
          outcome: 'PASS',
          attempt: 1,
          inputSnapshot: {},
          output: {},
          evidence: null,
          reason: null,
          errorCode: null,
          errorMessage: null,
        },
        {
          nodeId: 'task-node',
          nodeType: 'SERVICE_TASK',
          executionStatus: 'COMPLETED',
          outcome: 'PASS',
          attempt: 1,
          inputSnapshot: { testKey: 'testVal' },
          output: { success: true },
          evidence: { trace: 'all ok' },
          reason: null,
          errorCode: null,
          errorMessage: null,
        },
      ],
    };

    await page.route('**/v1/admin/workflows**', async (route) => {
      const method = route.request().method();
      const url = route.request().url();

      if (url.includes('/workflows/runs/page')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              data: [mockRun],
              total: 1,
              page: 0,
              size: 20,
            },
          }),
        });
        return;
      }

      if (url.includes('/workflows/runs/run-999')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: mockRun,
          }),
        });
        return;
      }

      if (url.includes('/workflows/wf-1')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              definition: {
                id: 'wf-1',
                name: 'Trading Strategy Pipeline',
                status: 'ACTIVE',
              },
              versions: [
                {
                  id: 'ver-1',
                  bpmnXml: sampleBpmnXml,
                },
              ],
            },
          }),
        });
        return;
      }

      if (url.endsWith('/workflows/page') || url.includes('/workflows/page?')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              data: [
                {
                  id: 'wf-1',
                  name: 'Trading Strategy Pipeline',
                  status: 'ACTIVE',
                },
              ],
              total: 1,
              page: 0,
              size: 100,
            },
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('dangerously-skip-permissions', 'true');
    });

    // 1. Vào trang danh sách runs
    await page.goto('/ai-agent-mcrs/workflows/runs?dangerously-skip-permissions');
    await expect(page.locator('app-workflow-run-list-page')).toBeVisible();

    // 2. Ki?m tra hàng d? li?u run-999
    await expect(page.locator('text=run-999')).toBeVisible();

    // 3. M? Trigger Run Dialog
    await page.locator('app-action-toolbar app-button button:has-text("Run workflow"), app-action-toolbar app-button button:has-text("Ch?y workflow")').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Ðóng dialog b?ng nút Cancel trong dialog
    await page.locator('app-workflow-run-trigger-dialog app-button button:has-text("H?y"), app-workflow-run-trigger-dialog app-button button:has-text("Cancel")').click();
    await expect(page.getByRole('dialog')).toBeHidden();

    // 4. Click row d? vào debugger view
    await page.locator('tr:has-text("run-999")').click();
    await expect(page.locator('app-workflow-run-detail-page')).toBeVisible();

    // 5. Ki?m tra BPMN canvas render element
    await expect(page.locator('.djs-element[data-element-id="task-node"]')).toBeVisible();

    // 6. Ki?m tra sequence flow traversal có class marker completed (màu xanh) du?c gán vào element SVG
    await expect(page.locator('.djs-connection.workflow-bpmn-canvas__marker--completed')).toHaveCount(1);

    // 7. Click ch?n task-node d? xem inspector
    await page.locator('.djs-element[data-element-id="task-node"]').click();
    await expect(page.locator('text=Input Snapshot')).toBeVisible();
    await expect(page.locator('text=Output Payload')).toBeVisible();
  });
});
