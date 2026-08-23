import { validateWorkflowGraph } from './workflow-validator';
import { WorkflowNode } from './workflow-studio.model';

describe('WorkflowValidator', () => {
  it('requires exactly one START and at least one END', () => {
    expect(validateWorkflowGraph({ nodes: [{ id: 'end', type: 'END' }], edges: [] })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'START_REQUIRED', severity: 'error' }),
      ]),
    );

    expect(validateWorkflowGraph({ nodes: [{ id: 'start', type: 'START' }], edges: [] })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'END_REQUIRED', severity: 'error' }),
      ]),
    );
  });

  it('rejects duplicate node IDs and dangling edges', () => {
    const issues = validateWorkflowGraph({
      nodes: [
        { id: 'start', type: 'START' },
        { id: 'start', type: 'END' },
        { id: 'end', type: 'END' },
      ],
      edges: [
        { source: 'missing-source', target: 'end' },
        { source: 'start', target: 'missing-target' },
      ],
    });

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'DUPLICATE_NODE_ID', nodeId: 'start' }),
      expect.objectContaining({ code: 'EDGE_SOURCE_NOT_FOUND', edgeId: 'missing-source__end' }),
      expect.objectContaining({ code: 'EDGE_TARGET_NOT_FOUND', edgeId: 'start__missing-target' }),
    ]));
  });

  it('reports invalid AI_GATE, CODE_GATE and LOGIC configuration', () => {
    const issues = validateWorkflowGraph({
      nodes: [
        { id: 'start', type: 'START' },
        aiGate({ id: 'ai', instruction: '', outputSchema: '', modelProfile: '', toolProfile: '' }),
        codeGate({ id: 'code', handler: '' }),
        { id: 'logic', type: 'LOGIC', operator: 'N_OF_M', config: { required: 3 } },
        { id: 'end', type: 'END' },
      ],
      edges: [
        { source: 'start', target: 'ai' },
        { source: 'start', target: 'code' },
        { source: 'ai', target: 'logic' },
        { source: 'logic', target: 'end' },
      ],
    });

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'AI_GATE_INSTRUCTION_REQUIRED', nodeId: 'ai', field: 'instruction' }),
      expect.objectContaining({ code: 'AI_GATE_OUTPUT_SCHEMA_REQUIRED', nodeId: 'ai', field: 'outputSchema' }),
      expect.objectContaining({ code: 'AI_GATE_MODEL_PROFILE_REQUIRED', nodeId: 'ai', field: 'modelProfile' }),
      expect.objectContaining({ code: 'AI_GATE_TOOL_PROFILE_REQUIRED', nodeId: 'ai', field: 'toolProfile' }),
      expect.objectContaining({ code: 'CODE_GATE_HANDLER_REQUIRED', nodeId: 'code', field: 'handler' }),
      expect.objectContaining({ code: 'N_OF_M_REQUIRED_OUT_OF_RANGE', nodeId: 'logic', field: 'config.required' }),
    ]));
  });

  it('reports orphan executable nodes and invalid branch semantics', () => {
    const issues = validateWorkflowGraph({
      nodes: [
        { id: 'start', type: 'START' },
        { id: 'switch', type: 'LOGIC', operator: 'SWITCH', config: { cases: { PASS: 'pass-end', FAIL: 'missing' }, default: 'default-end' } },
        { id: 'pass-end', type: 'END' },
        { id: 'default-end', type: 'END' },
        codeGate({ id: 'orphan', handler: 'NUMBER_COMPARE' }),
      ],
      edges: [
        { source: 'start', target: 'switch' },
        { source: 'switch', target: 'pass-end' },
        { source: 'switch', target: 'default-end' },
      ],
    });

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'NODE_NOT_REACHABLE_FROM_START', nodeId: 'orphan' }),
      expect.objectContaining({ code: 'NODE_CANNOT_REACH_END', nodeId: 'orphan' }),
      expect.objectContaining({ code: 'SWITCH_TARGET_NOT_FOUND', nodeId: 'switch', field: 'config.cases.FAIL' }),
    ]));
  });

  it('reports SWITCH case targets that are not outgoing branches', () => {
    const issues = validateWorkflowGraph({
      nodes: [
        { id: 'start', type: 'START' },
        { id: 'switch', type: 'LOGIC', operator: 'SWITCH', config: { cases: { PASS: 'pass-end' } } },
        { id: 'pass-end', type: 'END' },
      ],
      edges: [
        { source: 'start', target: 'switch' },
      ],
    });

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'SWITCH_BRANCH_EDGE_MISSING', nodeId: 'switch', field: 'config.cases.PASS' }),
    ]));
  });
});

function aiGate(overrides: Partial<Extract<WorkflowNode, { type: 'AI_GATE' }>> = {}): Extract<WorkflowNode, { type: 'AI_GATE' }> {
  return {
    id: 'ai',
    type: 'AI_GATE',
    instruction: 'Review profile',
    criteria: {},
    inputMapping: { mapping: {} },
    provider: 'codex',
    modelProfile: 'default',
    toolProfile: 'facebook-readonly',
    outputSchema: 'gate-result-v1',
    retryPolicy: { maxAttempts: 1 },
    timeoutPolicy: { timeoutSeconds: 30 },
    ...overrides,
  };
}

function codeGate(overrides: Partial<Extract<WorkflowNode, { type: 'CODE_GATE' }>> = {}): Extract<WorkflowNode, { type: 'CODE_GATE' }> {
  return {
    id: 'code',
    type: 'CODE_GATE',
    handler: 'NUMBER_COMPARE',
    config: {},
    inputMapping: { mapping: {} },
    retryPolicy: { maxAttempts: 1 },
    timeoutPolicy: { timeoutSeconds: 5 },
    ...overrides,
  };
}
