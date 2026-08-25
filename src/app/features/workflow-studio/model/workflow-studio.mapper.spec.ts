import { mapWorkflowDetailDto, mapWorkflowDetailToUpsertDto, mapWorkflowRunDto, mapWorkflowUpsertPayloadToDto, mapWorkflowValidationResponseDto } from './workflow-studio.mapper';
import { WorkflowDetailDto, WorkflowRunDto, WorkflowValidationResponseDto } from './workflow-studio.dto';
import { WorkflowDetail, WorkflowUpsertPayload } from './workflow-studio.model';

describe('workflow studio mapper', () => {
  const sampleBpmnXml = "<definitions xmlns=\"http://www.omg.org/spec/BPMN/20100524/MODEL\"><process id=\"wf_1\" /></definitions>";

  it('maps workflow detail DTO to domain with bpmnXml', () => {
    const dto: WorkflowDetailDto = {
      definition: {
        id: 'wf-1',
        name: 'KOC screening',
        description: 'Screen KOC profiles',
        status: 'DRAFT',
        currentDraftVersionId: 'ver-1',
        currentPublishedVersionId: null,
      },
      versions: [
        {
          id: 'ver-1',
          workflowDefinitionId: 'wf-1',
          version: 1,
          status: 'DRAFT',
          bpmnXml: sampleBpmnXml,
          runtime: { maxParallel: 3 },
          engineDeploymentId: 'dep-1',
          engineDefinitionId: 'def-1',
          engineDefinitionKey: 'key-1',
        },
      ],
    };

    const detail = mapWorkflowDetailDto(dto);
    const draft = detail.versions[0];

    expect(detail.definition.name).toBe('KOC screening');
    expect(draft.bpmnXml).toBe(sampleBpmnXml);
    expect(draft.runtime).toEqual({ maxParallel: 3 });
    expect(draft.engineDeploymentId).toBe('dep-1');
  });

  it('maps domain detail to upsert DTO sending bpmnXml and runtime', () => {
    const detail: WorkflowDetail = {
      definition: {
        id: 'wf-1',
        name: 'KOC screening',
        description: 'Screen KOC profiles',
        status: 'DRAFT',
        currentDraftVersionId: 'ver-1',
        currentPublishedVersionId: null,
      },
      versions: [
        {
          id: 'ver-1',
          workflowDefinitionId: 'wf-1',
          version: 1,
          status: 'DRAFT',
          bpmnXml: sampleBpmnXml,
          runtime: { maxParallel: 2 },
        },
      ],
    };

    const payload = mapWorkflowDetailToUpsertDto(detail);

    expect(payload).toEqual({
      name: 'KOC screening',
      description: 'Screen KOC profiles',
      bpmnXml: sampleBpmnXml,
      runtime: { maxParallel: 2 },
    });
  });

  it('maps upsert payload to DTO directly', () => {
    const payload: WorkflowUpsertPayload = {
      name: 'KOC screening',
      description: 'Screen KOC profiles',
      bpmnXml: sampleBpmnXml,
      runtime: { maxParallel: 2 },
    };

    const dto = mapWorkflowUpsertPayloadToDto(payload);

    expect(dto).toEqual({
      name: 'KOC screening',
      description: 'Screen KOC profiles',
      bpmnXml: sampleBpmnXml,
      runtime: { maxParallel: 2 },
    });
  });

  it('maps workflow validation response and normalizes elementId to nodeId', () => {
    const response: WorkflowValidationResponseDto = {
      valid: false,
      issues: [
        {
          code: 'ELEMENT_ERROR',
          severity: 'ERROR',
          message: 'Element failed',
          elementId: 'task-1',
        },
      ],
    };

    const mapped = mapWorkflowValidationResponseDto(response);

    expect(mapped.valid).toBe(false);
    expect(mapped.issues[0]).toEqual({
      code: 'ELEMENT_ERROR',
      severity: 'error',
      message: 'Element failed',
      elementId: 'task-1',
      nodeId: 'task-1',
    });
  });

  it('maps workflow run dto without engineType and clones snapshots', () => {
    const runDto: WorkflowRunDto = {
      id: 'run-1',
      workflowDefinitionId: 'wf-1',
      workflowVersionId: 'ver-1',
      status: 'RUNNING',
      input: { profile: 'koc' },
      startedAt: '2026-08-25T00:00:00Z',
      completedAt: null,
      finalOutcome: null,
      finalOutput: null,
      nodes: [
        {
          nodeId: 'task-1',
          nodeType: 'AI_TASK',
          executionStatus: 'COMPLETED',
          outcome: 'PASS',
          attempt: 1,
          inputSnapshot: { in: 1 },
          output: { out: 2 },
          evidence: null,
          reason: null,
          errorCode: null,
          errorMessage: null,
        },
      ],
    };

    const run = mapWorkflowRunDto(runDto);

    expect(run.id).toBe('run-1');
    expect(run.nodes[0].output).toEqual({ out: 2 });
  });
});
