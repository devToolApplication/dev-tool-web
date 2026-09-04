import { expect, test } from '@playwright/test';

test.describe('Workflow Studio Fullscreen Studio E2E', () => {
  test('tests optimized studio canvas: inline title, description modal, properties collapse, import xml and save', async ({ page }) => {
    let savedPayload: any = null;

    await page.route('**/v1/admin/workflows**', async (route) => {
      const method = route.request().method();
      const url = route.request().url();

      if (method === 'POST' && url.endsWith('/workflows')) {
        savedPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              definition: {
                id: 'wf-studio-opt-1',
                name: savedPayload.name,
                description: savedPayload.description,
                status: 'DRAFT',
                currentDraftVersionId: 'ver-1',
                currentPublishedVersionId: null,
              },
              versions: [
                {
                  id: 'ver-1',
                  workflowDefinitionId: 'wf-studio-opt-1',
                  version: 1,
                  status: 'DRAFT',
                  bpmnXml: savedPayload.bpmnXml,
                  runtime: null,
                }
              ]
            }
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.addInitScript(() => {
      window.localStorage.setItem('dangerously-skip-permissions', 'true');
    });

    // 1. M? màn hình t?o m?i
    await page.goto('/ai-agent-mcrs/workflows/create?dangerously-skip-permissions');
    await expect(page.locator('app-workflow-builder-page')).toBeVisible();

    // 2. Ch?nh s?a Inline Name trên Top Bar
    const nameInput = page.locator('.workflow-builder__name-input');
    await nameInput.fill('Studio Optimized Workflow');

    // 3. Ch?nh s?a Description qua Modal Drawer
    await page.locator('.workflow-builder__identity app-button button').click();
    await expect(page.locator('.workflow-desc-drawer')).toBeVisible();
    await page.locator('.workflow-desc-drawer textarea').fill('Optimized fullscreen BPMN studio canvas description');
    await page.locator('.workflow-desc-drawer button').click();
    await expect(page.locator('.workflow-desc-drawer')).toBeHidden();

    // 4. Test Toggle Properties Panel
    const togglePanelBtn = page.locator('.workflow-builder__top-controls app-button button');
    await togglePanelBtn.click();
    await expect(page.locator('.workflow-bpmn-canvas--properties-collapsed')).toBeVisible();

    await togglePanelBtn.click();
    await expect(page.locator('.workflow-bpmn-canvas--properties-collapsed')).toBeHidden();

    // 5. Test Import XML qua Drawer
    await page.locator('app-button[data-testid="action-toolbar-importBpmn"] button').click();
    await expect(page.locator('.workflow-import-drawer')).toBeVisible();

    const sampleCallActivityXml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xmlns:flowable="http://flowable.org/bpmn"
             targetNamespace="http://flowable.org/bpmn20">
  <process id="main_pipeline" name="Main Pipeline" isExecutable="true">
    <startEvent id="start_node" name="Start" />
    <sequenceFlow id="f_1" sourceRef="start_node" targetRef="call_ai_sub" />
    <callActivity id="call_ai_sub" name="Call AI Agent Subprocess" calledElement="callAiSdkSubProcess" flowable:inheritVariables="true">
      <extensionElements>
        <flowable:in source="promptData" target="prompt" />
        <flowable:out source="aiStatus" target="pipelineStatus" />
      </extensionElements>
    </callActivity>
    <sequenceFlow id="f_2" sourceRef="call_ai_sub" targetRef="end_node" />
    <endEvent id="end_node" name="End" />
  </process>
</definitions>`;

    await page.locator('.workflow-import-drawer textarea').fill(sampleCallActivityXml);
    await page.locator('.workflow-import-drawer button:has-text("XML")').click();
    await expect(page.locator('.workflow-import-drawer')).toBeHidden();

    // 6. Ki?m tra ph?n t? du?c render trên Canvas
    const callActivityElement = page.locator('.djs-element[data-element-id="call_ai_sub"]');
    await expect(callActivityElement).toBeVisible();

    // 7. Click Luu (Save)
    const saveButton = page.locator('app-button[data-testid="action-toolbar-save"] button');
    await saveButton.click();

    await expect.poll(() => savedPayload).not.toBeNull();
    expect(savedPayload.name).toBe('Studio Optimized Workflow');
    expect(savedPayload.description).toBe('Optimized fullscreen BPMN studio canvas description');
    expect(savedPayload.bpmnXml).toContain('call_ai_sub');
  });
});