import {
  workflowRunIsActive,
  workflowRunIsTerminal,
  workflowRunToRuntimeVisualState,
  workflowRunVersionForDetail,
} from './workflow-runtime.mapper';
import { WorkflowDetail, WorkflowRun } from './workflow-studio.model';

describe('workflow runtime mapper', () => {
  it('maps node executions to canvas overlay data without mutating the run', () => {
    const run = sampleRun();
    const original = structuredClone(run);

    expect(workflowRunToRuntimeVisualState(run, {
      nodes: [
        { id: 'start', type: 'START' },
        { id: 'gate', type: 'AI_GATE', instruction: '', criteria: {}, inputMapping: { mapping: {} }, provider: 'codex', agentCode: 'koc-rule-evaluator', workingDirectory: 'D:\\Code\\ai-agent-mcrs', outputSchema: 'gate-result-v1', retryPolicy: { maxAttempts: 1 }, timeoutPolicy: { timeoutSeconds: 60 } },
        { id: 'end', type: 'END' },
      ],
      edges: [
        { source: 'start', target: 'gate' },
        { source: 'gate', target: 'end' },
      ],
    })).toEqual({
      nodes: {
        start: 'COMPLETED',
        gate: 'ERROR',
      },
      edges: {
        start__gate: 'ERROR',
        gate__end: 'ERROR',
      },
    });
    expect(run).toEqual(original);
  });

  it('classifies active and terminal run statuses for polling', () => {
    expect(workflowRunIsActive('PENDING')).toBe(true);
    expect(workflowRunIsActive('RUNNING')).toBe(true);
    expect(workflowRunIsActive('COMPLETED')).toBe(false);
    expect(workflowRunIsTerminal('COMPLETED')).toBe(true);
    expect(workflowRunIsTerminal('ERROR')).toBe(true);
    expect(workflowRunIsTerminal('TIMED_OUT')).toBe(true);
    expect(workflowRunIsTerminal('CANCELLED')).toBe(true);
    expect(workflowRunIsTerminal('RUNNING')).toBe(false);
  });

  it('selects the workflow version used by a run before falling back to published or first version', () => {
    const detail: WorkflowDetail = {
      definition: {
        id: 'wf-1',
        name: 'KOC screening',
        description: null,
        status: 'ACTIVE',
        currentDraftVersionId: 'ver-draft',
        currentPublishedVersionId: 'ver-published',
      },
      versions: [
        { id: 'ver-draft', workflowDefinitionId: 'wf-1', version: 2, status: 'DRAFT', bpmnXml: '', runtime: null },
        { id: 'ver-published', workflowDefinitionId: 'wf-1', version: 1, status: 'PUBLISHED', bpmnXml: '', runtime: null },
      ],
    };

    expect(workflowRunVersionForDetail(detail, 'ver-draft')?.id).toBe('ver-draft');
    expect(workflowRunVersionForDetail(detail, 'missing')?.id).toBe('ver-published');
  });
});

function sampleRun(): WorkflowRun {
  return {
    id: 'run-1',
    workflowDefinitionId: 'wf-1',
    workflowVersionId: 'ver-1',
    status: 'RUNNING',
    input: {},
    startedAt: '2026-08-22T00:00:00Z',
    completedAt: null,
    finalOutcome: null,
    finalOutput: null,
    nodes: [
      {
        nodeId: 'start',
        nodeType: 'START',
        executionStatus: 'COMPLETED',
        outcome: 'PASS',
        attempt: 1,
        inputSnapshot: {},
        output: {},
        evidence: {},
        reason: null,
        errorCode: null,
        errorMessage: null,
      },
      {
        nodeId: 'gate',
        nodeType: 'AI_GATE',
        executionStatus: 'ERROR',
        outcome: 'FAIL',
        attempt: 2,
        inputSnapshot: {},
        output: {},
        evidence: {},
        reason: 'Safety failed',
        errorCode: 'MODEL_ERROR',
        errorMessage: 'Provider timeout',
      },
    ],
  };
}
