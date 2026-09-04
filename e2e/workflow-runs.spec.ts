import { expect, test } from '@playwright/test';

test.describe('Workflow Run Management & Debugger E2E', () => {
  test('verifies real AI workflow execution debug screen with green traversal lines and node inspection', async ({ page }) => {
    const realBpmnXml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:flowable="http://flowable.org/bpmn" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_CallAiSdk" targetNamespace="http://flowable.org/bpmn20">',
      '  <message id="msg_ai_callback" name="AiCallbackMessage" />',
      '  <process id="callAiSdkSubProcess" name="Call AI SDK Sub Process" isExecutable="true">',
      '    <startEvent id="startEvent" name="Receive Inputs" />',
      '    <sequenceFlow id="f_start" sourceRef="startEvent" targetRef="taskSubmitAi" />',
      '    <serviceTask id="taskSubmitAi" name="Submit AI Task" />',
      '    <sequenceFlow id="f_to_wait" sourceRef="taskSubmitAi" targetRef="waitAiCallback" />',
      '    <intermediateCatchEvent id="waitAiCallback" name="Wait AI Callback">',
      '      <messageEventDefinition messageRef="msg_ai_callback" />',
      '    </intermediateCatchEvent>',
      '    <sequenceFlow id="f_to_check" sourceRef="waitAiCallback" targetRef="gwCheckSuccess" />',
      '    <exclusiveGateway id="gwCheckSuccess" name="AI Succeeded?" default="f_failed" />',
      '    <sequenceFlow id="f_success" name="Completed" sourceRef="gwCheckSuccess" targetRef="endSuccess" />',
      '    <sequenceFlow id="f_failed" name="Failed" sourceRef="gwCheckSuccess" targetRef="gwCheckRetry" />',
      '    <exclusiveGateway id="gwCheckRetry" name="Can Retry?" default="f_max_exceeded" />',
      '    <sequenceFlow id="f_retry" name="Retry" sourceRef="gwCheckRetry" targetRef="taskSubmitAi" />',
      '    <sequenceFlow id="f_max_exceeded" name="Out of Retries" sourceRef="gwCheckRetry" targetRef="endFailed" />',
      '    <endEvent id="endSuccess" name="End Success" />',
      '    <endEvent id="endFailed" name="End Failed" />',
      '  </process>',
      '  <bpmndi:BPMNDiagram id="BPMNDiagram_callAiSdkSubProcess">',
      '    <bpmndi:BPMNPlane id="BPMNPlane_callAiSdkSubProcess" bpmnElement="callAiSdkSubProcess">',
      '      <bpmndi:BPMNShape id="startEvent_di" bpmnElement="startEvent">',
      '        <dc:Bounds x="160" y="142" width="36" height="36" />',
      '      </bpmndi:BPMNShape>',
      '      <bpmndi:BPMNShape id="taskSubmitAi_di" bpmnElement="taskSubmitAi">',
      '        <dc:Bounds x="260" y="120" width="120" height="80" />',
      '      </bpmndi:BPMNShape>',
      '      <bpmndi:BPMNShape id="waitAiCallback_di" bpmnElement="waitAiCallback">',
      '        <dc:Bounds x="440" y="142" width="36" height="36" />',
      '      </bpmndi:BPMNShape>',
      '      <bpmndi:BPMNShape id="gwCheckSuccess_di" bpmnElement="gwCheckSuccess" isMarkerVisible="true">',
      '        <dc:Bounds x="540" y="135" width="50" height="50" />',
      '      </bpmndi:BPMNShape>',
      '      <bpmndi:BPMNShape id="gwCheckRetry_di" bpmnElement="gwCheckRetry" isMarkerVisible="true">',
      '        <dc:Bounds x="540" y="265" width="50" height="50" />',
      '      </bpmndi:BPMNShape>',
      '      <bpmndi:BPMNShape id="endSuccess_di" bpmnElement="endSuccess">',
      '        <dc:Bounds x="780" y="142" width="36" height="36" />',
      '      </bpmndi:BPMNShape>',
      '      <bpmndi:BPMNShape id="endFailed_di" bpmnElement="endFailed">',
      '        <dc:Bounds x="780" y="272" width="36" height="36" />',
      '      </bpmndi:BPMNShape>',
      '      <bpmndi:BPMNEdge id="f_start_di" bpmnElement="f_start">',
      '        <di:waypoint x="196" y="160" />',
      '        <di:waypoint x="260" y="160" />',
      '      </bpmndi:BPMNEdge>',
      '      <bpmndi:BPMNEdge id="f_to_wait_di" bpmnElement="f_to_wait">',
      '        <di:waypoint x="380" y="160" />',
      '        <di:waypoint x="440" y="160" />',
      '      </bpmndi:BPMNEdge>',
      '      <bpmndi:BPMNEdge id="f_to_check_di" bpmnElement="f_to_check">',
      '        <di:waypoint x="476" y="160" />',
      '        <di:waypoint x="540" y="160" />',
      '      </bpmndi:BPMNEdge>',
      '      <bpmndi:BPMNEdge id="f_success_di" bpmnElement="f_success">',
      '        <di:waypoint x="590" y="160" />',
      '        <di:waypoint x="780" y="160" />',
      '      </bpmndi:BPMNEdge>',
      '      <bpmndi:BPMNEdge id="f_failed_di" bpmnElement="f_failed">',
      '        <di:waypoint x="565" y="185" />',
      '        <di:waypoint x="565" y="265" />',
      '      </bpmndi:BPMNEdge>',
      '      <bpmndi:BPMNEdge id="f_retry_di" bpmnElement="f_retry">',
      '        <di:waypoint x="540" y="290" />',
      '        <di:waypoint x="320" y="290" />',
      '        <di:waypoint x="320" y="200" />',
      '      </bpmndi:BPMNEdge>',
      '      <bpmndi:BPMNEdge id="f_max_exceeded_di" bpmnElement="f_max_exceeded">',
      '        <di:waypoint x="590" y="290" />',
      '        <di:waypoint x="780" y="290" />',
      '      </bpmndi:BPMNEdge>',
      '    </bpmndi:BPMNPlane>',
      '  </bpmndi:BPMNDiagram>',
      '</definitions>',
    ].join('\n');

    const realAiWorkflowRun = {
      id: 'run-ai-task-001',
      workflowDefinitionId: '6a99a073ce94f6e109d4c338',
      workflowVersionId: '6a99a073ce94f6e109d4c339',
      status: 'COMPLETED',
      input: {
        agentCode: 'koc-search-planner',
        provider: 'codex',
        prompt: 'Tr? ra danh sách mcp agent dang có'
      },
      startedAt: '2026-09-04T10:30:00Z',
      completedAt: '2026-09-04T10:30:25Z',
      finalOutcome: 'PASS',
      finalOutput: {
        agents: [
          'facebook-candidate-discovery',
          'facebook-evidence-verifier',
          'koc-search-planner',
          'koc-rule-evaluator',
          'koc-adjudicator'
        ]
      },
      nodes: [
        {
          nodeId: 'startEvent',
          nodeType: 'START_EVENT',
          executionStatus: 'COMPLETED',
          outcome: 'PASS',
          attempt: 1,
          inputSnapshot: { agentCode: 'koc-search-planner' },
          output: { agentCode: 'koc-search-planner' },
          evidence: null,
          reason: null,
          errorCode: null,
          errorMessage: null,
        },
        {
          nodeId: 'taskSubmitAi',
          nodeType: 'SERVICE_TASK',
          executionStatus: 'COMPLETED',
          outcome: 'PASS',
          attempt: 1,
          inputSnapshot: { prompt: 'Tr? ra danh sách mcp agent dang có' },
          output: { taskId: 'task-ai-123', status: 'SUBMITTED' },
          evidence: { codexSessionId: '01a06a75-ca31-7f82' },
          reason: null,
          errorCode: null,
          errorMessage: null,
        },
        {
          nodeId: 'waitAiCallback',
          nodeType: 'INTERMEDIATE_CATCH_EVENT',
          executionStatus: 'COMPLETED',
          outcome: 'PASS',
          attempt: 1,
          inputSnapshot: { message: 'AiCallbackMessage' },
          output: { aiStatus: 'COMPLETED' },
          evidence: null,
          reason: null,
          errorCode: null,
          errorMessage: null,
        },
        {
          nodeId: 'gwCheckSuccess',
          nodeType: 'EXCLUSIVE_GATEWAY',
          executionStatus: 'COMPLETED',
          outcome: 'PASS',
          attempt: 1,
          inputSnapshot: { aiStatus: 'COMPLETED' },
          output: { branch: 'f_success' },
          evidence: null,
          reason: null,
          errorCode: null,
          errorMessage: null,
        },
        {
          nodeId: 'endSuccess',
          nodeType: 'END_EVENT',
          executionStatus: 'COMPLETED',
          outcome: 'PASS',
          attempt: 1,
          inputSnapshot: { success: true },
          output: { success: true },
          evidence: null,
          reason: null,
          errorCode: null,
          errorMessage: null,
        }
      ],
    };

    await page.route('**/v1/admin/workflows**', async (route) => {
      const url = route.request().url();

      if (url.includes('/workflows/runs/page')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              data: [realAiWorkflowRun],
              total: 1,
              page: 0,
              size: 20,
            },
          }),
        });
        return;
      }

      if (url.includes('/workflows/runs/run-ai-task-001')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: realAiWorkflowRun,
          }),
        });
        return;
      }

      if (url.includes('/workflows/6a99a073ce94f6e109d4c338')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              definition: {
                id: '6a99a073ce94f6e109d4c338',
                name: 'WORK_FLOW_AI_PROCESS',
                status: 'DRAFT',
              },
              versions: [
                {
                  id: '6a99a073ce94f6e109d4c339',
                  bpmnXml: realBpmnXml,
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
                  id: '6a99a073ce94f6e109d4c338',
                  name: 'WORK_FLOW_AI_PROCESS',
                  status: 'DRAFT',
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

    // 1. M? danh sách Runs
    await page.goto('/ai-agent-mcrs/workflows/runs?dangerously-skip-permissions');
    await expect(page.locator('app-workflow-run-list-page')).toBeVisible();

    // 2. Ki?m tra thông tin Run ID th?c thi trong b?ng
    await expect(page.locator('text=run-ai-task-001')).toBeVisible();

    // 3. Click vào Run d? vào màn Debugger
    await page.locator('tr:has-text("run-ai-task-001")').click();
    await expect(page.locator('app-workflow-run-detail-page')).toBeVisible();

    // 4. Verify tên Workflow hi?n th? trên Subtitle
    await expect(page.locator('text=WORK_FLOW_AI_PROCESS')).toBeVisible();

    // 5. Verify các Node BPMN trên Canvas du?c render d?y d?
    await expect(page.locator('.djs-element[data-element-id="taskSubmitAi"]')).toBeVisible();
    await expect(page.locator('.djs-element[data-element-id="waitAiCallback"]')).toBeVisible();
    await expect(page.locator('.djs-element[data-element-id="gwCheckSuccess"]')).toBeVisible();
    await expect(page.locator('.djs-element[data-element-id="endSuccess"]')).toBeVisible();

    // 6. Verify toàn b? các du?ng Sequence Flow di qua dã du?c highlight màu xanh (completed marker)
    // f_start, f_to_wait, f_to_check, f_success
    const greenConnections = page.locator('.djs-connection.workflow-bpmn-canvas__marker--completed');
    await expect(greenConnections).toHaveCount(4);

    // 7. Click ch?n Node 'taskSubmitAi' d? xem Node Inspector
    await page.locator('.djs-element[data-element-id="taskSubmitAi"]').click();
    await expect(page.locator('app-section-panel').filter({ hasText: 'Chi tiet thuc thi' }).locator('text=taskSubmitAi')).toBeVisible();
    await expect(page.locator('text=Input Snapshot')).toBeVisible();
    await expect(page.locator('text=Output Payload')).toBeVisible();
    await expect(page.locator('text=Evidence')).toBeVisible();

    // 8. Ch?p screenshot làm b?ng ch?ng
    await page.screenshot({ path: '../../test-results/workflow-run-debug-verified.png', fullPage: true });
  });
});
