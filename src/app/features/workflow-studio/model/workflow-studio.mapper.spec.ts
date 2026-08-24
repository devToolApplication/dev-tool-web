import {
  mapWorkflowDetailDto,
  mapWorkflowDetailToUpsertDto,
} from './workflow-studio.mapper';
import { WorkflowDetailDto } from './workflow-studio.dto';
import { WorkflowDetail } from './workflow-studio.model';

describe('workflow studio mapper', () => {
  it('maps workflow detail DTO to domain and keeps AI gate contract fields', () => {
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
          definition: {
            nodes: [
              { id: 'start', type: 'START' },
              {
                id: 'ai-gate',
                type: 'AI_GATE',
                instruction: 'Check profile safety',
                criteria: { minFollowers: 1000 },
                inputMapping: { mapping: { profile: '${input.profile}' } },
                provider: 'codex',
                agentCode: 'koc-rule-evaluator',
                workingDirectory: 'D:\\Code\\ai-agent-mcrs',
                outputSchema: 'gate-result-v1',
                retryPolicy: { maxAttempts: 2 },
                timeoutPolicy: { timeoutSeconds: 3600 },
              },
              { id: 'end', type: 'END' },
            ],
            edges: [
              { source: 'start', target: 'ai-gate' },
              { source: 'ai-gate', target: 'end' },
            ],
          },
          runtime: { maxParallel: 3 },
          compiledPlan: {
            nodes: {},
            dependencies: {},
            dependents: {},
            entryNodes: ['start'],
            terminalNodes: ['end'],
          },
        },
      ],
    };

    const detail = mapWorkflowDetailDto(dto);
    const draft = detail.versions[0];
    const aiGate = draft.definition.nodes.find((node) => node.id === 'ai-gate');

    expect(detail.definition.name).toBe('KOC screening');
    expect(draft.definition.edges).toEqual([
      { source: 'start', target: 'ai-gate' },
      { source: 'ai-gate', target: 'end' },
    ]);
    expect(aiGate).toMatchObject({
      id: 'ai-gate',
      type: 'AI_GATE',
      instruction: 'Check profile safety',
      criteria: { minFollowers: 1000 },
      inputMapping: { mapping: { profile: '${input.profile}' } },
      provider: 'codex',
      agentCode: 'koc-rule-evaluator',
      workingDirectory: 'D:\\Code\\ai-agent-mcrs',
      outputSchema: 'gate-result-v1',
      retryPolicy: { maxAttempts: 2 },
      timeoutPolicy: { timeoutSeconds: 3600 },
    });
  });

  it('maps domain detail to upsert DTO with editor metadata', () => {
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
          definition: {
            nodes: [
              { id: 'start', type: 'START' },
              {
                id: 'code-gate',
                type: 'CODE_GATE',
                handler: 'NUMBER_COMPARE',
                config: { operator: 'LT' },
                inputMapping: { mapping: { left: '${input.followers}', right: 50000 } },
                retryPolicy: { maxAttempts: 1 },
                timeoutPolicy: { timeoutSeconds: 5 },
              },
              { id: 'end', type: 'END' },
            ],
            edges: [
              { source: 'start', target: 'code-gate' },
              { source: 'code-gate', target: 'end' },
            ],
          },
          runtime: { maxParallel: 2 },
          editor: {
            viewport: { x: 12, y: 24, zoom: 0.85 },
            nodes: {
              start: { x: 0, y: 0 },
              'code-gate': { x: 240, y: 0 },
            },
          },
          compiledPlan: null,
        },
      ],
    };

    const payload = mapWorkflowDetailToUpsertDto(detail);

    expect(payload).toEqual({
      name: 'KOC screening',
      description: 'Screen KOC profiles',
      definition: {
        nodes: [
          { id: 'start', type: 'START' },
          {
            id: 'code-gate',
            type: 'CODE_GATE',
            handler: 'NUMBER_COMPARE',
            config: { operator: 'LT' },
            inputMapping: { mapping: { left: '${input.followers}', right: 50000 } },
            retryPolicy: { maxAttempts: 1 },
            timeoutPolicy: { timeoutSeconds: 5 },
          },
          { id: 'end', type: 'END' },
        ],
        edges: [
          { source: 'start', target: 'code-gate' },
          { source: 'code-gate', target: 'end' },
        ],
      },
      runtime: { maxParallel: 2 },
      editor: {
        viewport: { x: 12, y: 24, zoom: 0.85 },
        nodes: {
          start: { x: 0, y: 0 },
          'code-gate': { x: 240, y: 0 },
        },
      },
    });
  });

  it('keeps AI_GATE configuration fields when mapping a draft back to an upsert DTO', () => {
    const detail: WorkflowDetail = {
      definition: {
        id: 'wf-1',
        name: 'AI workflow',
        description: null,
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
          definition: {
            nodes: [
              { id: 'start', type: 'START' },
              {
                id: 'ai',
                type: 'AI_GATE',
                instruction: 'Review profile',
                criteria: { minScore: 80 },
                inputMapping: { mapping: { candidate: '${input.candidate}' } },
                provider: 'claude',
                agentCode: 'koc-rule-evaluator',
                workingDirectory: 'D:\\Code\\ai-agent-mcrs',
                outputSchema: 'gate-result-v1',
                retryPolicy: { maxAttempts: 2 },
                timeoutPolicy: { timeoutSeconds: 3600 },
              },
              { id: 'end', type: 'END' },
            ],
            edges: [
              { source: 'start', target: 'ai' },
              { source: 'ai', target: 'end' },
            ],
          },
          runtime: null,
          compiledPlan: null,
        },
      ],
    };

    const payload = mapWorkflowDetailToUpsertDto(detail);

    expect(payload.definition.nodes[1]).toEqual({
      id: 'ai',
      type: 'AI_GATE',
      instruction: 'Review profile',
      criteria: { minScore: 80 },
      inputMapping: { mapping: { candidate: '${input.candidate}' } },
      provider: 'claude',
      agentCode: 'koc-rule-evaluator',
      workingDirectory: 'D:\\Code\\ai-agent-mcrs',
      outputSchema: 'gate-result-v1',
      retryPolicy: { maxAttempts: 2 },
      timeoutPolicy: { timeoutSeconds: 3600 },
    });
    expect(JSON.stringify(payload.definition.nodes[1])).not.toMatch(/modelProfile|toolProfile/);
  });

  it('uses the current draft version when mapping an existing workflow to an upsert DTO', () => {
    const detail: WorkflowDetail = {
      definition: {
        id: 'wf-1',
        name: 'Versioned workflow',
        description: null,
        status: 'ACTIVE',
        currentDraftVersionId: 'ver-draft',
        currentPublishedVersionId: 'ver-published',
      },
      versions: [
        {
          id: 'ver-published',
          workflowDefinitionId: 'wf-1',
          version: 1,
          status: 'PUBLISHED',
          definition: {
            nodes: [{ id: 'published-start', type: 'START' }],
            edges: [],
          },
          runtime: { maxParallel: 1 },
          compiledPlan: null,
        },
        {
          id: 'ver-draft',
          workflowDefinitionId: 'wf-1',
          version: 2,
          status: 'DRAFT',
          definition: {
            nodes: [{ id: 'draft-start', type: 'START' }],
            edges: [],
          },
          runtime: { maxParallel: 3 },
          compiledPlan: null,
        },
      ],
    };

    const payload = mapWorkflowDetailToUpsertDto(detail);

    expect(payload.definition.nodes).toEqual([{ id: 'draft-start', type: 'START' }]);
    expect(payload.runtime).toEqual({ maxParallel: 3 });
  });

  it('falls back to the draft version before the first version when current draft id is missing', () => {
    const detail: WorkflowDetail = {
      definition: {
        id: 'wf-1',
        name: 'Versioned workflow',
        description: null,
        status: 'ACTIVE',
        currentDraftVersionId: null,
        currentPublishedVersionId: 'ver-published',
      },
      versions: [
        {
          id: 'ver-published',
          workflowDefinitionId: 'wf-1',
          version: 1,
          status: 'PUBLISHED',
          definition: {
            nodes: [{ id: 'published-start', type: 'START' }],
            edges: [],
          },
          runtime: { maxParallel: 1 },
          compiledPlan: null,
        },
        {
          id: 'ver-draft',
          workflowDefinitionId: 'wf-1',
          version: 2,
          status: 'DRAFT',
          definition: {
            nodes: [{ id: 'draft-start', type: 'START' }],
            edges: [],
          },
          runtime: { maxParallel: 3 },
          compiledPlan: null,
        },
      ],
    };

    const payload = mapWorkflowDetailToUpsertDto(detail);

    expect(payload.definition.nodes).toEqual([{ id: 'draft-start', type: 'START' }]);
  });

  it('deep clones editor node positions when mapping detail DTOs', () => {
    const dto: WorkflowDetailDto = {
      definition: {
        id: 'wf-1',
        name: 'Editable workflow',
        description: null,
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
          definition: {
            nodes: [{ id: 'start', type: 'START' }],
            edges: [],
          },
          runtime: null,
          compiledPlan: null,
          editor: {
            viewport: { x: 0, y: 0, zoom: 1 },
            nodes: {
              start: { x: 10, y: 20 },
            },
          },
        },
      ],
    };

    const detail = mapWorkflowDetailDto(dto);

    dto.versions[0].editor!.nodes!['start'].x = 99;

    expect(detail.versions[0].editor?.nodes?.['start']).toEqual({ x: 10, y: 20 });
  });

  it('keeps Flowable engine metadata, BPMN nodes and sequence flow conditions', () => {
    const dto: WorkflowDetailDto = {
      definition: {
        id: 'wf-flowable',
        name: 'Flowable evaluation',
        description: null,
        status: 'ACTIVE',
        currentDraftVersionId: null,
        currentPublishedVersionId: 'ver-flowable',
      },
      versions: [
        {
          id: 'ver-flowable',
          workflowDefinitionId: 'wf-flowable',
          version: 1,
          status: 'PUBLISHED',
          engineType: 'FLOWABLE',
          engineDeploymentId: 'dep-1',
          engineDefinitionId: 'proc-1',
          engineDefinitionKey: 'workflow_ver-flowable',
          compiledBpmnXml: '<definitions />',
          definition: {
            nodes: [
              { id: 'start', type: 'START_EVENT', name: 'Start' },
              { id: 'xor', type: 'EXCLUSIVE_GATEWAY', name: 'Score branch' },
              {
                id: 'ai',
                type: 'AI_TASK',
                name: 'AI review',
                config: { agentCode: 'koc-rule-evaluator' },
                retryPolicy: { maxAttempts: 2 },
              },
              { id: 'end', type: 'END_EVENT', name: 'End' },
            ],
            edges: [
              {
                id: 'flow-pass',
                source: 'xor',
                target: 'ai',
                name: 'Pass',
                defaultFlow: false,
                condition: {
                  type: 'COMPARE',
                  left: { path: 'input.candidate.followers' },
                  operator: 'GTE',
                  right: { literal: 1000 },
                },
              },
              { id: 'flow-default', source: 'xor', target: 'end', defaultFlow: true },
            ],
          },
          runtime: null,
          compiledPlan: null,
        },
      ],
    };

    const detail = mapWorkflowDetailDto(dto);
    const payload = mapWorkflowDetailToUpsertDto(detail);

    expect(detail.versions[0]).toMatchObject({
      engineType: 'FLOWABLE',
      engineDeploymentId: 'dep-1',
      engineDefinitionId: 'proc-1',
      engineDefinitionKey: 'workflow_ver-flowable',
      compiledBpmnXml: '<definitions />',
    });
    expect(payload.definition.nodes[2]).toMatchObject({
      id: 'ai',
      type: 'AI_TASK',
      config: { agentCode: 'koc-rule-evaluator' },
      retryPolicy: { maxAttempts: 2 },
    });
    expect(payload.definition.edges[0]).toMatchObject({
      id: 'flow-pass',
      condition: { type: 'COMPARE', operator: 'GTE' },
      defaultFlow: false,
    });
  });
});
