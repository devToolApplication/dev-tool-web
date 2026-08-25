import { buildWorkflowListTable, createDraftWorkflowDetail, workflowVersionLabel } from './workflow-lifecycle.config';

describe('workflow lifecycle config', () => {
  it('creates a new workflow with starter BPMN XML', () => {
    const detail = createDraftWorkflowDetail();
    const version = detail.versions[0];

    expect(detail.definition.id).toBe('');
    expect(detail.definition.name).toBe('workflowStudio.lifecycle.untitled');
    expect(version.bpmnXml).toContain('<definitions');
    expect(version.bpmnXml).toContain('<process id="workflow_draft"');
  });

  it('builds list row actions for edit, run, publish and runs', () => {
    const actionIds = buildWorkflowListTable().columns
      .flatMap((column) => column.actions ?? [])
      .map((action) => action.id);

    expect(actionIds).toEqual(expect.arrayContaining(['edit', 'run', 'publish', 'runs']));
  });

  it('labels workflow versions with status and version number', () => {
    expect(workflowVersionLabel({ version: 3, status: 'PUBLISHED' })).toBe('v3 - PUBLISHED');
  });
});
